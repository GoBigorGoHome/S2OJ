import type { BasicProvider, IBasicProvider, RemoteAccount } from './interface';
import * as Time from './utils/time';
import Logger from './utils/logger';
import htmlspecialchars from './utils/htmlspecialchars';

const logger = new Logger('vjudge');

class AccountService {
  api: IBasicProvider;

  constructor(
    public Provider: BasicProvider,
    public account: RemoteAccount,
    private request: any
  ) {
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
    judge_time: string
  ) {
    const next = async payload => {
      return await this.request('/submit', {
        'update-status': true,
        fetch_new: false,
        id,
        status:
          payload.status ||
          (payload.test_id ? `Judging Test #${payload.test_id}` : 'Judging'),
      });
    };

    const end = async payload => {
      if (payload.error) {
        return await this.request('/submit', {
          submit: true,
          fetch_new: false,
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
          }),
          judge_time,
        });
      }

      return await this.request('/submit', {
        submit: true,
        fetch_new: false,
        id,
        result: JSON.stringify({
          status: 'Judged',
          score: payload.score,
          time: payload.time,
          memory: payload.memory,
          details:
            payload.details ||
            '<div>' +
              `<info-block>ID = ${payload.id || 'None'}</info-block>` +
              `<info-block>VERDICT = ${payload.status}</info-block>` +
              '</div>',
        }),
        judge_time,
      });
    };

    try {
      const rid = await this.api.submitProblem(
        problem_id,
        language,
        code,
        id,
        next,
        end
      );

      if (!rid) return;

      await this.api.waitForSubmission(problem_id, rid, next, end);
    } catch (e) {
      logger.error(e);
      await end({ error: true, message: e.message });
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
  private providers: Record<string, AccountService> = {};

  constructor(private request: any) {}

  async addProvider(type: string) {
    if (this.providers[type]) throw new Error(`duplicate provider ${type}`);
    const provider = await import(`./providers/${type}`);
    const account = provider.getAccountInfoFromEnv();

    if (!account) throw new Error(`no account info for ${type}`);

    this.providers[type] = new AccountService(
      provider.default,
      account,
      this.request
    );
  }

  async judge(
    id: number,
    type: string,
    problem_id: string,
    language: string,
    code: string,
    judge_time: string
  ) {
    if (!this.providers[type]) throw new Error(`no provider ${type}`);

    this.providers[type].judge(id, problem_id, language, code, judge_time);
  }
}

export async function apply(request: any) {
  const vjudge = new VJudge(request);

  await vjudge.addProvider('codeforces');
  await vjudge.addProvider('atcoder');
  await vjudge.addProvider('uoj');
  await vjudge.addProvider('loj');

  return vjudge;
}