import type { BasicProvider, IBasicProvider, RemoteAccount } from './interface';
import * as Time from './utils/time';
import Logger from './utils/logger';
import htmlspecialchars from './utils/htmlspecialchars';

const logger = new Logger('vjudge');

class AccountService {
  api: IBasicProvider;

  constructor(public Provider: BasicProvider, public account: RemoteAccount) {
    this.api = new Provider(account);
    this.main().catch(e =>
      logger.error(`Error occured in ${account.type}/${account.handle}`, e)
    );
  }

  async judge(
    id: number,
    problem_id: string,
    language: string,
    code: string,
    next,
    end
  ) {
    try {
      // 提交代码。
      // rid 是远程OJ的提交编号。
      const rid = await this.api.submitProblem(
        problem_id,
        language,
        code,
        id,
        next,
        end
      );

      if (!rid) return;

      await this.api.waitForSubmission(rid, next, end, problem_id);
    } catch (e) {
      logger.error(e);

      await end({ error: true, status: 'Judgment Failed', message: e.message });
    }
  }

  async login() {
    const login = await this.api.ensureLogin();
    if (login === true) {
      logger.info(`${this.account.type}/${this.account.handle}: logged in`);
      return true;
    }
    logger.warn(
      `${this.account.type}/${this.account.handle}: login fail`,
      login || ''
    );
    return false;
  }

  async main() {
    const res = await this.login();
    if (!res) return;
    setInterval(() => this.login(), Time.hour);
  }
}

class VJudge {
  private p_imports: Record<string, any> = {};
  private providers: Record<string, AccountService> = {};

  constructor(private request: any) {}

  async importProvider(type: string) {
    if (this.p_imports[type]) throw new Error(`duplicate provider ${type}`);
    const provider = await import(`./providers/${type}`);

    this.p_imports[type] = provider.default;
  }

  async addProvider(type: string) {
    if (this.p_imports[type]) throw new Error(`duplicate provider ${type}`);
    const provider = await import(`./providers/${type}`);
    const account = provider.getAccountInfoFromEnv();

    if (!account) {
      // throw new Error(`no account info for ${type}`);

      logger.error(`no account info for ${type}`);

      return;
    }

    this.p_imports[type] = provider.default;
    this.providers[type] = new AccountService(provider.default, account);
  }

  async judge(
    id: number,
    type: string,
    problem_id: string,
    language: string,
    code: string,
    judge_time: string,
    config
  ) {
    // 用到了 payload 的 status 或 test_id
    const next = async payload => {
      return await this.request('/submit', {
        'update-status': 1,
        fetch_new: 0,
        id,
        status:
          payload.status ||
          (payload.test_id ? `Judging Test #${payload.test_id}` : 'Judging'),
      });
    };

    const end = async payload => {
      if (payload.error) {
        return await this.request('/submit', {
          submit: 1,
          fetch_new: 0,
          id,
          result: JSON.stringify({
            status: 'Judged',
            score: 0,
            error: payload.status,
            details:
              '<div>' +
              `<info-block>ID = ${payload.id || 'None'}</info-block>` +
              `<error>${htmlspecialchars(payload.message)}</error>` +
              '</div>',
            ...(payload.result || {}),
          }),
          judge_time,
        });
      }

      return await this.request('/submit', {
        submit: 1,
        fetch_new: 0,
        id,
        result: JSON.stringify({
          status: 'Judged',
          score: payload.score,
          time: payload.time,
          memory: payload.memory,
          details:
            payload.details ||
            '<div>' +
              `<info-block>REMOTE_SUBMISSION_ID = ${
                payload.id || 'None'
              }\nVERDICT = ${payload.status}</info-block>` +
              '</div>',
          ...(payload.result || {}),
        }),
        judge_time,
      });
    };

    if (!config.remote_submit_type || config.remote_submit_type == 'bot') {
      // 使用共用帐号提交。
      if (!this.providers[type]) throw new Error(`No provider ${type}`);

      // 调用 AccountService 的 judge() 方法。
      // 最终是调用 IBasicProvider 的 submitProblem 方法。
      await this.providers[type].judge(
        id,
        problem_id,
        language,
        code,
        next,
        end
      );
    } else if (config.remote_submit_type == 'my') {
      // 使用自有帐号提交。
      if (!this.p_imports[type]) throw new Error(`No provider ${type}`);

      try {
        const provider = this.p_imports[type].constructFromAccountData(
          JSON.parse(config.remote_account_data)
        );

        const rid = await provider.submitProblem(
          problem_id,
          language,
          code,
          id,
          next,
          end
        );

        if (!rid) return;

        await provider.waitForSubmission(rid, next, end, problem_id);
      } catch (e) {
        logger.error(e);

        await end({
          error: true,
          status: 'Judgment Failed',
          message: e.message,
        });
      }
    } else if (config.remote_submit_type == 'archive') {
      try {
        const provider = this.p_imports[type].constructFromAccountData(
          JSON.parse(config.remote_account_data)
        );

        if (!config.remote_submission_id) {
          return await end({
            error: true,
            status: 'Judgment Failed',
            message: 'REMOTE_SUBMISSION_ID is not set.',
          });
        }

        if (await provider.ensureIsOwnSubmission(config.remote_submission_id)) {
          await provider.waitForSubmission(
            config.remote_submission_id,
            next,
            end,
            problem_id,
            true
          );
        } else {
          return await end({
            error: true,
            status: 'Judgment Failed',
            message: 'Remote submission does not belongs to current user.',
          });
        }
      } catch (e) {
        logger.error(e);

        await end({
          error: true,
          status: 'Judgment Failed',
          message: e.message,
        });
      }
    } else {
      throw new Error(
        'Unsupported remote submit type: ' + config.remote_submit_type
      );
    }
  }
}

export async function apply(request: any) {
  const vjudge = new VJudge(request);

  await vjudge.addProvider('codeforces');
  await vjudge.addProvider('atcoder');
  // await vjudge.addProvider('uoj');
  // await vjudge.addProvider('loj');
  // await vjudge.addProvider('luogu');
  // await vjudge.addProvider('qoj');

  return vjudge;
}
