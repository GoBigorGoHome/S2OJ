import { JSDOM } from 'jsdom';
import superagent from 'superagent';
import proxy from 'superagent-proxy';
import { crlf, LF } from 'crlf-normalize';
import { stripHtml } from 'string-strip-html';
import sleep from '../utils/sleep';
import mathSum from 'math-sum';
import { IBasicProvider, RemoteAccount, USER_AGENT } from '../interface';
import { normalize, VERDICT } from '../verdict';
import Logger from '../utils/logger';

proxy(superagent);
const logger = new Logger('remote/codeforces');

const LANGS_MAP = {
  C: {
    name: 'GNU GCC C11 5.1.0',
    id: 43,
    comment: '//',
  },
  'C++': {
    name: 'GNU G++14 6.4.0',
    id: 50,
    comment: '//',
  },
  'C++17': {
    name: 'GNU G++17 7.3.0',
    id: 54,
    comment: '//',
  },
  'C++20': {
    name: 'GNU G++20 11.2.0 (64 bit, winlibs)',
    id: 73,
    comment: '//',
  },
  Pascal: {
    name: 'Free Pascal 3.0.2',
    id: 4,
    comment: '//',
  },
  'Python2.7': {
    name: 'Python 2.7.18',
    id: 7,
    comment: '#',
  },
  Python3: {
    name: 'Python 3.9.1',
    id: 31,
    comment: '#',
  },
};

export function getAccountInfoFromEnv(): RemoteAccount | null {
  const {
    CODEFORCES_HANDLE,
    CODEFORCES_PASSWORD,
    CODEFORCES_ENDPOINT = 'https://codeforces.com',
    CODEFORCES_PROXY,
  } = process.env;

  if (!CODEFORCES_HANDLE || !CODEFORCES_PASSWORD) return null;

  const account: RemoteAccount = {
    type: 'codeforces',
    handle: CODEFORCES_HANDLE,
    password: CODEFORCES_PASSWORD,
    endpoint: CODEFORCES_ENDPOINT,
  };

  if (CODEFORCES_PROXY) account.proxy = CODEFORCES_PROXY;

  return account;
}

function parseProblemId(id: string) {
  const [, type, contestId, problemId] = id.startsWith('921')
    ? ['', '921', '01']
    : /^(|GYM)(\d+)([A-Z]+[0-9]*)$/.exec(id);
  if (type === 'GYM' && +contestId < 100000) {
    return [type, (+contestId + 100000).toString(), problemId];
  }
  return [type, contestId, problemId];
}

export default class CodeforcesProvider implements IBasicProvider {
  constructor(public account: RemoteAccount) {
    if (account.cookie) this.cookie = account.cookie;
    this.account.endpoint ||= 'https://codeforces.com';
  }

  static constructFromAccountData(data) {
    return new this({
      type: 'codeforces',
      cookie: Object.entries(data).map(([key, value]) => `${key}=${value}`),
    });
  }

  cookie: string[] = [];
  csrf: string;

  get(url: string) {
    logger.debug('get', url);
    if (!url.includes('//')) url = `${this.account.endpoint}${url}`;
    const req = superagent
      .get(url)
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

  tta(_39ce7: string) {
    let _tta = 0;
    for (let c = 0; c < _39ce7.length; c++) {
      _tta = (_tta + (c + 1) * (c + 2) * _39ce7.charCodeAt(c)) % 1009;
      if (c % 3 === 0) _tta++;
      if (c % 2 === 0) _tta *= 2;
      if (c > 0)
        _tta -=
          Math.floor(_39ce7.charCodeAt(Math.floor(c / 2)) / 2) * (_tta % 5);
      _tta = ((_tta % 1009) + 1009) % 1009;
    }
    return _tta;
  }

  async getCsrfToken(url: string, referer = '') {
    const { text: html, header } = await this.get(url).set('Referer', referer);
    const {
      window: { document },
    } = new JSDOM(html);
    if (document.body.children.length < 2 && html.length < 512) {
      throw new Error(document.body.textContent!);
    }
    const ftaa = this.getCookie('70a7c28f3de') || 'n/a';
    const bfaa = this.getCookie('raa') || this.getCookie('bfaa') || 'n/a';
    return [
      (
        document.querySelector('meta[name="X-Csrf-Token"]') ||
        document.querySelector('input[name="csrf_token"]')
      )?.getAttribute('content'),
      ftaa,
      bfaa,
      header,
    ];
  }

  get loggedIn() {
    return this.get('/').then(res => {
      const html = res.text;

      if (html.length < 1000 && html.includes('Redirecting...')) {
        logger.debug('Got a redirect', html);
        return false;
      }

      if (res.header['set-cookie']) {
        const _39ce7 = this.getCookie.call(
          { cookie: res.header['set-cookie'] },
          '39ce7'
        );

        if (_39ce7) this.setCookie('39ce7', _39ce7);
      }

      return html.includes('header-bell__img');
    });
  }

  async ensureLogin() {
    if (await this.loggedIn) return true;

    logger.info('retry normal login');

    if (!this.account.handle) return false;

    const [csrf, ftaa, bfaa, header] = await this.getCsrfToken('/enter');

    if (header['set-cookie']) {
      this.cookie = header['set-cookie'];
    }

    const res = await this.post('/enter').send({
      csrf_token: csrf,
      action: 'enter',
      ftaa,
      bfaa,
      handleOrEmail: this.account.handle,
      password: this.account.password,
      remember: 'on',
      _tta: this.tta(this.getCookie('39ce7')),
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

    if (comment) {
      const msg = `S2OJ Submission #${submissionId} @ ${new Date().getTime()}`;
      if (typeof comment === 'string') code = `${comment} ${msg}\n${code}`;
      else if (comment instanceof Array)
        code = `${comment[0]} ${msg} ${comment[1]}\n${code}`;
    }

    const [type, contestId, problemId] = parseProblemId(id);
    const referer =
      this.account.endpoint +
      (type !== 'GYM'
        ? `/problemset/problem/${contestId}/${problemId}`
        : `/gym/${contestId}/problem/${problemId}`);

    logger.debug('referer', referer);

    const [csrf, ftaa, bfaa] = await this.getCsrfToken(
      type !== 'GYM' ? '/problemset/submit' : `/gym/${contestId}/submit`,
      referer
    );

    logger.debug(
      'Submitting',
      id,
      programType,
      lang,
      `(S2OJ Submission #${submissionId})`
    );

    await next({ status: 'Submitting to Codeforces...' });

    // TODO: check submit time to ensure submission
    const { text: submit, error } = await this.post(
      `/${
        type !== 'GYM' ? 'problemset' : `gym/${contestId}`
      }/submit?csrf_token=${csrf}`
    )
      .send({
        csrf_token: csrf,
        action: 'submitSolutionFormSubmitted',
        programTypeId: programType.id,
        source: code,
        tabsize: 4,
        sourceFile: '',
        ftaa,
        bfaa,
        _tta: this.tta(this.getCookie('39ce7')),
        ...(type !== 'GYM'
          ? {
              submittedProblemCode: contestId + problemId,
              sourceCodeConfirmed: true,
            }
          : {
              submittedProblemIndex: problemId,
            }),
      })
      .set('Referer', referer);

    if (error) {
      end({
        error: true,
        status: 'Judgment Failed',
        message: 'Failed to submit code.',
      });

      return null;
    }

    const {
      window: { document: statusDocument },
    } = new JSDOM(submit);
    const message = Array.from(statusDocument.querySelectorAll('.error'))
      .map(i => i.textContent)
      .join('')
      .replace(/&nbsp;/g, ' ')
      .trim();

    if (message) {
      end({ error: true, status: 'Compile Error', message });
      return null;
    }

    await next({ status: 'Submitted to Codeforces' });

    const { text: status } = await this.get(
      type !== 'GYM' ? '/problemset/status?my=on' : `/gym/${contestId}/my`
    ).retry(3);
    const {
      window: { document },
    } = new JSDOM(status);
    this.csrf = document
      .querySelector('meta[name="X-Csrf-Token"]')
      .getAttribute('content');

    const submission = document
      .querySelector('[data-submission-id]')
      .getAttribute('data-submission-id');

    return type !== 'GYM' ? submission : `${contestId}#${submission}`;
  }

  async ensureIsOwnSubmission(id: string) {
    throw new Error('Method not implemented.');
  }

  async waitForSubmission(id: string, next, end) {
    let count = 0;
    let fail = 0;

    const contestId = id.includes('#') ? id.split('#')[0] : null;
    const submissionId = id.includes('#') ? id.split('#')[1] : id;

    while (count < 360 && fail < 60) {
      count++;
      await sleep(500);

      try {
        const { body } = await this.post('/data/submitSource')
          .set(
            'referer',
            contestId
              ? `https://codeforces.com/gym/${contestId}/my`
              : 'https://codeforces.com/problemset/status?my=on'
          )
          .send({
            csrf_token: this.csrf,
            submissionId: submissionId,
          })
          .retry(3);

        if (body.compilationError === 'true') {
          return await end({
            id: submissionId,
            error: true,
            status: 'Compile Error',
            message: crlf(body['checkerStdoutAndStderr#1'], LF),
          });
        }

        const time = mathSum(
          Object.keys(body)
            .filter(k => k.startsWith('timeConsumed#'))
            .map(k => +body[k])
        );
        const memory =
          Math.max(
            ...Object.keys(body)
              .filter(k => k.startsWith('memoryConsumed#'))
              .map(k => +body[k])
          ) / 1024;
        await next({ test_id: body.testCount });

        if (body.waiting === 'true') continue;

        let files = [];

        if (body?.source) {
          files.push({
            name: 'answer.code',
            content: body.source,
          });
        }

        const testCount = +body.testCount;
        const status =
          VERDICT[
            Object.keys(VERDICT).find(k => normalize(body.verdict).includes(k))
          ];
        let tests: string[] = [];

        for (let i = 1; i <= testCount; i++) {
          let test_info = '';
          let info_text =
            VERDICT[
              Object.keys(VERDICT).find(k =>
                normalize(body[`verdict#${i}`]).includes(k)
              )
            ];

          test_info += `<test num="${i}" info="${info_text}" time="${
            body[`timeConsumed#${i}`]
          }" memory="${+body[`memoryConsumed#${i}`] / 1024}">`;

          const parse = (id: string) => crlf(body[id], LF);

          test_info += `<in>${parse(`input#${i}`)}</in>\n`;
          test_info += `<out>${parse(`output#${i}`)}</out>\n`;
          test_info += `<ans>${parse(`answer#${i}`)}</ans>\n`;
          test_info += `<res>${parse(`checkerStdoutAndStderr#${i}`)}</res>\n`;

          test_info += '</test>';

          tests.push(test_info);
        }

        const remote_handle = stripHtml(body.partyName).result;
        const details =
          '<div>' +
          '<remote-result-container>' +
          '<remote-result-table>' +
          Object.entries({
            比赛: stripHtml(body.contestName).result,
            题目: stripHtml(body.problemName).result,
            提交记录: `<a href="https://codeforces.com${body.href}">${submissionId}</a>`,
            账号: `<a href="https://codeforces.com/profile/${remote_handle}">${remote_handle}</a>`,
            状态: stripHtml(body.verdict).result,
          })
            .map(
              o => `<remote-result-tr name="${o[0]}">${o[1]}</remote-result-tr>`
            )
            .join('') +
          '</remote-result-table>' +
          '</remote-result-container>' +
          `<tests>${tests.join('\n')}</tests>` +
          '</div>';

        return await end({
          id: submissionId,
          status,
          score: status === 'Accepted' ? 100 : 0,
          time,
          memory,
          details,
          result: { files },
        });
      } catch (e) {
        logger.error(e);

        fail++;
      }
    }

    return await end({
      id: submissionId,
      error: true,
      status: 'Judgment Failed',
      message: 'Failed to fetch submission details.',
    });
  }
}
