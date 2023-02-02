import fs from 'fs-extra';
import superagent from 'superagent';
import proxy from 'superagent-proxy';
import Logger from './utils/logger';
import sleep from './utils/sleep';
import * as TIME from './utils/time';
import htmlspecialchars from './utils/htmlspecialchars';
import { apply } from './vjudge';
import path from 'path';
import child from 'child_process';

proxy(superagent);

const logger = new Logger('daemon');

interface UOJConfig {
  server_url: string;
  judger_name: string;
  password: string;
}

interface UOJSubmission {
  id: number;
  problem_id: number;
  problem_mtime: number;
  content: any;
  status: string;
  judge_time: string;
}

export default async function daemon(config: UOJConfig) {
  const request = (url: string, data = {}) =>
    superagent
      .post(`${config.server_url}/judge${url}`)
      .set('Content-Type', 'application/x-www-form-urlencoded')
      .send(
        Object.entries({
          judger_name: config.judger_name,
          password: config.password,
          ...data,
        })
          .map(
            ([k, v]) =>
              `${k}=${encodeURIComponent(
                typeof v === 'string' ? v : JSON.stringify(v)
              )}`
          )
          .join('&')
      );
  const vjudge = await apply(request);

  while (true) {
    try {
      const { text, error } = await request('/submit');

      if (error) {
        logger.error('/submit', error.message);

        await sleep(3 * TIME.second);
      } else if (text.startsWith('Nothing to judge')) {
        await sleep(3 * TIME.second);
      } else {
        const data: UOJSubmission = JSON.parse(text);
        const { id, content, judge_time } = data;
        const config = Object.fromEntries(content.config);
        const tmpdir = `/tmp/s2oj_rmj/${id}/`;

        if (config.test_sample_only === 'on') {
          await request('/submit', {
            submit: true,
            fetch_new: false,
            id,
            result: JSON.stringify({
              status: 'Judged',
              score: 100,
              time: 0,
              memory: 0,
              details: '<info-block>Sample test is not available.</info-block>',
            }),
            judge_time,
          });

          continue;
        }

        fs.ensureDirSync(tmpdir);

        const reportError = async (error: string, details: string) => {
          await request('/submit', {
            submit: true,
            fetch_new: false,
            id,
            result: JSON.stringify({
              status: 'Judged',
              score: 0,
              error,
              details: `<error>${htmlspecialchars(details)}</error>`,
            }),
            judge_time,
          });
        };

        // Download source code
        logger.debug('Downloading source code.', id);
        const zipFilePath = path.resolve(tmpdir, 'all.zip');
        const res = request(`/download${content.file_name}`);
        const stream = fs.createWriteStream(zipFilePath);
        res.pipe(stream);

        try {
          await new Promise((resolve, reject) => {
            stream.on('finish', resolve);
            stream.on('error', reject);
          });
        } catch (e) {
          await reportError(
            'Judgment Failed',
            `Failed to download source code.`
          );
          logger.error('Failed to download source code.', id, e.message);

          fs.removeSync(tmpdir);

          continue;
        }

        // Unzip source code
        logger.debug('Unzipping source code.', id);
        const extractedPath = path.resolve(tmpdir, 'all');

        try {
          await new Promise((resolve, reject) => {
            child.exec(`unzip ${zipFilePath} -d ${extractedPath}`, e => {
              if (e) reject(e);
              else resolve(true);
            });
          });
        } catch (e) {
          await reportError('Judgment Failed', `Failed to unzip source code.`);
          logger.error('Failed to unzip source code.', id, e.message);

          fs.removeSync(tmpdir);

          continue;
        }

        // Read source code
        logger.debug('Reading source code.', id);
        const sourceCodePath = path.resolve(extractedPath, 'answer.code');
        let code = '';

        try {
          code = fs.readFileSync(sourceCodePath, 'utf-8');
        } catch (e) {
          await reportError('Judgment Failed', `Failed to read source code.`);
          logger.error('Failed to read source code.', id, e.message);

          fs.removeSync(tmpdir);

          continue;
        }

        // Start judging
        logger.info('Start judging', id, `(problem ${data.problem_id})`);
        try {
          await vjudge.judge(
            id,
            config.remote_online_judge,
            config.remote_problem_id,
            config.answer_language,
            code,
            judge_time
          );
        } catch (err) {
          await reportError(
            'Judgment Failed',
            'No details, please contact admin!'
          );
          logger.error('Judgment Failed.', id, err.message);

          fs.removeSync(tmpdir);

          continue;
        }

        fs.removeSync(tmpdir);
      }
    } catch (err) {
      logger.error(err.message);

      await sleep(3 * TIME.second);
    }
  }
}