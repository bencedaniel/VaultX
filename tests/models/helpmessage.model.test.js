import mongoose from 'mongoose';
import Helpmessage from '../../models/helpmessage.js';

describe('Helpmessage model', () => {
  it('should require url and HelpMessage fields', async () => {
    const doc = new Helpmessage({});
    let err;
    try {
      await doc.validate();
    } catch (e) {
      err = e;
    }
    expect(err).toBeDefined();
    expect(err.errors.url).toBeDefined();
    expect(err.errors.HelpMessage).toBeDefined();
  });

  it('should default active to true and style to danger', async () => {
    const doc = new Helpmessage({ url: '/foo', HelpMessage: 'test' });
    expect(doc.active).toBe(true);
    expect(doc.style).toBe('danger');
  });

  it('should accept all fields and types', async () => {
    const doc = new Helpmessage({
      url: '/bar',
      HelpMessage: 'msg',
      active: false,
      style: 'info',
    });
    expect(doc.url).toBe('/bar');
    expect(doc.HelpMessage).toBe('msg');
    expect(doc.active).toBe(false);
    expect(doc.style).toBe('info');
  });

  it('should require active to be boolean', async () => {
    const doc = new Helpmessage({ url: '/foo', HelpMessage: 'test', active: 'notbool' });
    let err;
    try {
      await doc.validate();
    } catch (e) {
      err = e;
    }
    expect(err).toBeDefined();
    expect(err.errors.active).toBeDefined();
  });
});
