import request from 'supertest';
import express from 'express';
import path from 'path';
import fs from 'fs';

describe('newHelpMessage.ejs form', () => {
  let app;
  beforeAll(() => {
    app = express();
    app.set('view engine', 'ejs');
    app.set('views', path.join(process.cwd(), 'views'));
    app.use(express.urlencoded({ extended: false }));
    app.get('/test/newHelpMessage', (req, res) => {
      res.render('helpmessages/newHelpMessage', { formData: req.query });
    });
  });

  it('should render empty form fields by default', async () => {
    const res = await request(app).get('/test/newHelpMessage');
    expect(res.status).toBe(200);
    expect(res.text).toContain('<textarea class="form-control shadow-none" id="HelpMessage" name="HelpMessage" required style="height: 100px;"></textarea>');
    expect(res.text).toContain('<input type="text" class="form-control shadow-none" id="url" name="url" placeholder="https://example.com" value="" required>');
  });

  it('should render form fields with provided formData', async () => {
    const res = await request(app).get('/test/newHelpMessage?HelpMessage=Test+help&url=%2Ffoo%2Fbar&active=true&style=info');
    expect(res.status).toBe(200);
    expect(res.text).toContain('Test help');
    expect(res.text).toContain('value="/foo/bar"');
    expect(res.text).toContain('<option value="true" selected>Active</option>');
    expect(res.text).toContain('<option value="info" selected>Info</option>');
  });

  it('should require all fields on submit', async () => {
    // This is a static template test, so we just check for required attributes
    const res = await request(app).get('/test/newHelpMessage');
    expect(res.text).toContain('required');
    expect(res.text).toContain('name="HelpMessage"');
    expect(res.text).toContain('name="url"');
    expect(res.text).toContain('name="active"');
    expect(res.text).toContain('name="style"');
  });
});
