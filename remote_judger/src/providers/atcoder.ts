import { JSDOM } from 'jsdom';
import superagent from 'superagent';
import proxy from 'superagent-proxy';
import sleep from '../utils/sleep';
import { IBasicProvider, RemoteAccount, USER_AGENT } from '../interface';
import Logger from '../utils/logger';
import * as cheerio from 'cheerio';

proxy(superagent);
const logger = new Logger('remote/atcoder');

const LANGS_MAP = {
  C: {
    name: 'C (GCC 12.2)',
    id: 5017,
    comment: '//',
  },
  'C++17': {
    name: 'C++17 (GCC 12.2)',
    id: 5053,
    comment: '//',
  },
  'C++20': {
    name: 'C++20 (GCC 12.2)',
    id: 5001,
    comment: '//',
  },
  Python3: {
    name: 'Python (CPython 3.11.4)',
    id: 5055,
    comment: '#',
  },
};

export function getAccountInfoFromEnv(): RemoteAccount | null {
  const {
    ATCODER_HANDLE,
    ATCODER_PASSWORD,
    ATCODER_ENDPOINT = 'https://atcoder.jp',
    ATCODER_PROXY,
  } = process.env;

  if (!ATCODER_HANDLE || !ATCODER_PASSWORD) return null;

  const account: RemoteAccount = {
    type: 'atcoder',
    handle: ATCODER_HANDLE,
    password: ATCODER_PASSWORD,
    endpoint: ATCODER_ENDPOINT,
  };

  if (ATCODER_PROXY) account.proxy = ATCODER_PROXY;

  return account;
}

function parseProblemId(id: string) {
  let [, contestId, problemId] = /^(\w+)_([a-z1-9][1-9]?)$/.exec(id);

  problemId = `${contestId}_${problemId}`;

  contestId = contestId.replace(/_/g, '-');

  return [contestId, problemId];
}

export default class AtcoderProvider implements IBasicProvider {
  constructor(public account: RemoteAccount) {
    if (account.cookie) this.cookie = account.cookie;
    this.account.endpoint ||= 'https://atcoder.jp';
  }

  static constructFromAccountData(data) {
    throw new Error('Method not implemented.');
  }

  cookie: string[] = ['language=en'];
  csrf: string;

  get(url: string) {
    logger.debug('get', url);
    if (!url.includes('//')) url = `${this.account.endpoint}${url}`;
    const req = superagent
      .get(url)
      .redirects(0)
      .ok(res => res.status < 400)
      .set('Cookie', this.cookie)
      .set('User-Agent', USER_AGENT);
    if (this.account.proxy) return req.proxy(this.account.proxy);
    return req;
  }

  post(url: string) {
    logger.debug('post', url, this.cookie);
    if (!url.includes('//')) url = `${this.account.endpoint}${url}`;
    const req = superagent
      .post(url)
      .type('form')
      .redirects(0)
      .ok(res => res.status < 400)
      .set('Cookie', this.cookie)
      .set('User-Agent', USER_AGENT);
    if (this.account.proxy) return req.proxy(this.account.proxy);
    return req;
  }

  getCookie(target: string) {
    return this.cookie
      .find(i => i.startsWith(`${target}=`))
      ?.split('=')[1]
      ?.split(';')[0];
  }

  setCookie(target: string, value: string) {
    this.cookie = this.cookie.filter(i => !i.startsWith(`${target}=`));
    this.cookie.push(`${target}=${value}`);
  }

  async getCsrfToken(url: string) {
    const { text: html, header } = await this.get(url);
    const {
      window: { document },
    } = new JSDOM(html);

    if (header['set-cookie']) {
      this.cookie = header['set-cookie'];
    }

    let value = /csrfToken = "(.+?)"/g.exec(html);
    if (value) return value[1];

    if (document.body.children.length < 2 && html.length < 512) {
      throw new Error(document.body.textContent!);
    }

    return document
      .querySelector('input[name="csrf_token"]')
      ?.getAttribute('value');
  }

  get loggedIn() {
    return this.get('/login').then(res => {
      const html = res.text;

      if (res.header['set-cookie']) {
        this.cookie = res.header['set-cookie'];
      }

      if (html.includes('<a href="/login">Sign In</a>')) return false;
      return true;
    });
  }

  async ensureLogin() {
    if (await this.loggedIn) return true;
    logger.info('retry normal login');
    const csrf = await this.getCsrfToken('/login');
    const res = await this.post('/login').send({
      csrf_token: csrf,
      username: this.account.handle,
      password: this.account.password,
    });
    const cookie = res.header['set-cookie'];
    if (cookie) {
      this.cookie = cookie;
    }
    if (await this.loggedIn) {
      logger.success('Logged in');
      return true;
    }
    return false;
  }

  async submitProblem(
    id: string,
    lang: string,
    code: string,
    submissionId: number,
    next,
    end
  ) {
    if (!(await this.ensureLogin())) {
      await end({
        error: true,
        status: 'Judgment Failed',
        message: 'Login failed',
      });

      return null;
    }

    const programType = LANGS_MAP[lang] || LANGS_MAP['C++'];
    const comment = programType.comment;

    // 给提交的代码加上注释
    const msg = `S2OJ Submission #${submissionId} @ ${new Date().getTime()}`;
    if (typeof comment === 'string') code = `${comment} ${msg}\n${code}`;
    else if (comment instanceof Array)
      code = `${comment[0]} ${msg} ${comment[1]}\n${code}`;

    const [contestId, problemId] = parseProblemId(id);
    const csrf = await this.getCsrfToken(
      `/contests/${contestId}/tasks/${problemId}`
    );

    logger.debug(
      'Submitting',
      id,
      programType,
      lang,
      `(S2OJ Submission #${submissionId})`
    );

    await next({ status: 'Submitting to AtCoder...' });

    // TODO: check submit time to ensure submission
    const res = await this.post(`/contests/${contestId}/submit`).send({
      csrf_token: csrf,
      'data.TaskScreenName': problemId,
      'data.LanguageId': programType.id,
      sourceCode: code,
    });

    if (res.error) {
      await end({
        error: true,
        status: 'Judgment Failed',
        message: 'Failed to submit code.',
      });

      return null;
    }

    if (!res.redirect) {
      // 可能是语言id错误或是代码太长。
      await end({
        error: true,
        status: 'Judgment Failed',
        message: 'Failed to submit code. Internal error, please report to admin.',
      });
      return null;
    }

    if (res.header['set-cookie']) {
      this.cookie = res.header['set-cookie'];
    }

    await next({ status: 'Submitted to AtCoder' });

    const { text: status, header: status_header } = await this.get(
      `/contests/${contestId}/submissions/me`
    ).retry(3);

    if (status_header['set-cookie']) {
      this.cookie = status_header['set-cookie'];
    }

    const {
      window: { document },
    } = new JSDOM(status);

    const submission_dom = document.querySelector('.submission-score[data-id]');
    if (!submission_dom) {
      await end({
        error: true,
        status: 'Judgment Failed',
        message: 'Failed to submit code. Please report to admin.',
      });

      return null;
    }
    const remoteSubmissionId = submission_dom.getAttribute('data-id');
    const detail_url = `/contests/${contestId}/submissions/${remoteSubmissionId}`;
    const { text } = await this.get(detail_url).retry(3);
    if (RegExp(msg).test(text)) {
      return remoteSubmissionId;
    }

    await end({
      error: true,
      status: 'Judgment Failed',
      message: 'Failed to submit code. Please report to admin.',
    });
    return null;
  }

  async ensureIsOwnSubmission(id: string) {
    throw new Error('Method not implemented.');
  }

  async get_points(contest_id: string, submission_id: string) {
    const detail_url = `/contests/${contest_id}/submissions/${submission_id}`;
    const { text } = await this.get(detail_url).retry(3);
    const $ = cheerio.load(text);

    let sample_test_cnt = 0;
    let all_test_cnt = 0;
    const panel_3 = $('#main-container > div.row > div:nth-child(2) > div.panel:nth(2)');
    const test_cases_counts = panel_3.find('table > tbody > tr').map((i, elem) => {
      const test_set_name = $(elem).find('td:first').text().trim().toLowerCase();
      const test_cases_cnt = $(elem).find('td:last').text().split(',').length;
      if (test_set_name == 'all') {
        all_test_cnt = test_cases_cnt;
      } else {
        sample_test_cnt = test_cases_cnt;
      }
    });

    if (all_test_cnt == 0)
      return -1;

    let sample_ac_cnt = 0;
    let all_ac_cnt = 0;

    const panel_2 = $('#main-container > div.row > div:nth-child(2) > div.panel:nth(1)');
    // const set_names = panel_2.find('table > tbody > tr:nth(0) > th:gt(0)').map((i, elem) => {
    //   return $(elem).text().trim().toLowerCase();
    // }).toArray();
    const ac_counts = panel_2.find('table > tbody > tr:nth(2) > td').map((i, elem) => {
      const ac_span = $(elem).find('span.label-success');
      if (ac_span.length == 0) {
        return 0;
      }
      return +ac_span.parent().next().text().match(/\d+/)?.at(0)
    }).get();

    if (ac_counts.length == 1) {
      all_ac_cnt = ac_counts[0];
    } else {
      all_ac_cnt = ac_counts[1];
      sample_ac_cnt = ac_counts[0];
    }
    return (all_ac_cnt - sample_ac_cnt) * 100 / (all_test_cnt - sample_test_cnt);
  }

  // id：submission ID on AtCoder.
  async waitForSubmission(id: string, next, end, problem_id: string) {
    let count = 0;
    let fail = 0;

    const [contestId] = parseProblemId(problem_id);
    const status_url = `/contests/${contestId}/submissions/me/status/json?reload=true&sids[]=${id}`;

    while (count < 180 && fail < 10) {
      count++;
      await sleep(1000);

      try {
        const { body, header } = await this.get(status_url).retry(3);

        if (header['set-cookie']) {
          this.cookie = header['set-cookie'];
        }

        const result = body.Result[id];
        const {
          window: { document },
        } = new JSDOM(`<table>${result.Html}</table>`);

        const elements = document.querySelectorAll('td');
        const statusTd = elements[0];
        const statusElem = statusTd.querySelector('span');

        if (
          statusElem.title === 'Waiting for Judging' ||
          statusElem.title === 'Waiting for Re-judging' ||
          ['WJ', 'WR'].includes(statusElem.innerHTML.trim())
        ) {
          await next({ status: '[AtCoder] Waiting for Judging' });

          continue;
        }

        if (
          statusElem.title === 'Judging' ||
          (statusTd.colSpan == 3 &&
            statusTd.className.includes('waiting-judge'))
        ) {
          await next({ test_id: /(\d+)/.exec(statusElem.innerHTML)[1] || 0 });

          continue;
        }

        if (statusElem.title === 'Compilation Error') {
          return await end({
            id,
            error: true,
            status: 'Compile Error',
            message: '',
          });
        }

        if (statusElem.title === 'Internal Error') {
          return await end({
            error: true,
            status: 'Judgment Failed',
            message: 'AtCoder Internal Error.',
          });
        }

        const time = parseInt(elements[1].innerHTML.trim());
        const memory = parseInt(elements[2].innerHTML.trim());

        // 计算得分
        let atcoder_score = 0;
        if (statusElem.title === 'Accepted' ||
          statusElem.innerHTML.trim() === 'AC') {
          atcoder_score = 100;
        } else {
          atcoder_score = await this.get_points(contestId, id);
        }

        return await end({
          id,
          status: statusElem.title || 'None',
          score: atcoder_score,
          time,
          memory,
        });
      } catch (e) {
        logger.error(e);

        fail++;
      }
    }

    return await end({
      id,
      error: true,
      status: 'Judgment Failed',
      message: 'Failed to fetch submission details.',
    });
  }
}
