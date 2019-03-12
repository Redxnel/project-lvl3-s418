import nock from 'nock';
import httpAdapter from 'axios/lib/adapters/http';
import { promises as fs } from 'fs';
import os from 'os';
import path from 'path';
import axios from 'axios';
import load from '../src';

const host = 'http://localhost';

axios.defaults.adapter = httpAdapter;

let tmpdir = '';

beforeAll(async () => {
  tmpdir = await fs.mkdtemp(path.join(os.tmpdir(), 'test'));
});

describe('Test', () => {
  test('Download page', async () => {
    nock(host)
      .get('/test')
      .reply(200, 'test data');

    await load(`${host}/test`, tmpdir);
    const recievedData = await fs.readFile(path.join(tmpdir, 'localhost-test.html'), 'utf-8');
    return expect(recievedData).toBe('test data');
  });
});
