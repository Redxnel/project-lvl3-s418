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
let dataCss = '';
let dataHtml = '';
let dataImg = '';

beforeEach(async () => {
  tmpdir = await fs.mkdtemp(path.join(os.tmpdir(), 'test'));
  dataCss = await fs.readFile('./__tests__/__fixtures__/style.css', 'utf-8');
  dataHtml = await fs.readFile('./__tests__/__fixtures__/resumeAfterUpdate.html', 'utf-8');
  dataImg = await fs.readFile('./__tests__/__fixtures__/image.png', 'utf-8');
});

describe('Test', () => {
  it('Download simple page', async () => {
    nock(host)
      .get('/test')
      .reply(200, 'test data');

    await load(`${host}/test`, tmpdir);
    const recievedData = await fs.readFile(path.join(tmpdir, 'localhost-test.html'), 'utf-8');
    return expect(recievedData).toBe('<html><head></head><body>test data</body></html>');
  });

  it('Download page and resource', async () => {
    nock(host)
      .get('/')
      .replyWithFile(200, `${__dirname}/__fixtures__/resume.html`);

    nock(host)
      .get('/style.css')
      .replyWithFile(200, `${__dirname}/__fixtures__/style.css`);

    nock(host)
      .get('/image.png')
      .replyWithFile(200, `${__dirname}/__fixtures__/image.png`);

    await load(host, tmpdir);
    const recievedData = await fs.readFile(path.join(tmpdir, 'localhost.html'), 'utf-8');
    const recievedCss = await fs.readFile(path.join(tmpdir, 'localhost_files/style.css'), 'utf-8');
    const recievedImg = await fs.readFile(path.join(tmpdir, 'localhost_files/image.png'), 'utf-8');
    const quantityFileInTmpDir = await fs.readdir(path.join(tmpdir, 'localhost_files'));
    expect(recievedData).not.toMatch(dataHtml);
    expect(recievedCss).toMatch(dataCss);
    expect(dataImg).toMatch(recievedImg);
    expect(quantityFileInTmpDir.length).toBe(2);
  });

  it('Errors 404', async () => {
    nock(host)
      .get('/')
      .reply(404);

    await expect(load(host, tmpdir)).rejects.toThrowErrorMatchingSnapshot();
  });

  it('Errors directory', async () => {
    nock(host)
      .get('/test')
      .reply(200, 'test data');

    await expect(load(`${host}/test`, 'var')).rejects.toThrowErrorMatchingSnapshot();
  });
});
