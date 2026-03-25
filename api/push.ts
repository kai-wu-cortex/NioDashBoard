import type { VercelRequest, VercelResponse } from '@vercel/node';
import puppeteer from 'puppeteer';
import chromium from '@sparticuz/chromium';
import fs from 'fs';
import path from 'path';

// 11 widgets distributed across 3 rows
const WIDGET_SELECTORS = [
  // Row 1 (3 widgets)
  '.flex:nth-child(2) > div:nth-child(1) > div', // battery
  '.flex:nth-child(2) > div:nth-child(2) > div', // doorsWindows
  '.flex:nth-child(2) > div:nth-child(3) > div', // vehicleDoors
  // Row 2 (4 widgets)
  '.flex:nth-child(3) > div:nth-child(1) > div', // fotaVersion
  '.flex:nth-child(3) > div:nth-child(2) > div', // gps
  '.flex:nth-child(3) > div:nth-child(3) > div', // specialModes
  '.flex:nth-child(3) > div:nth-child(4) > div', // charging
  // Row 3 (4 widgets)
  '.flex:nth-child(4) > div:nth-child(1) > div', // vehicleInfo
  '.flex:nth-child(4) > div:nth-child(2) > div', // seatHeating
  '.flex:nth-child(4) > div:nth-child(3) > div', // connection
  '.flex:nth-child(4) > div:nth-child(4) > div', // temperature
];

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const {
      api_key: apiKey,
      device_id: deviceId,
      border = "1",
      dither_type: ditherType = "DIFFUSION",
    } = req.query;

    if (!apiKey || !deviceId) {
      return res.status(400).json({
        error: "Missing required parameters: api_key and device_id are required",
        example: `${req.headers.host}/api/push?api_key=your_api_key&device_id=quote/0&border=1&dither_type=DIFFUSION`,
      });
    }

    const borderNum = Number(border);
    const ditherTypeStr = String(ditherType);

    // Step 1: Fetch latest data from NIO API via Vercel reverse proxy
    // Use Vercel reverse proxy to avoid IP blocking from NIO
    const protocol = req.headers['x-forwarded-proto'] || 'https';
    const host = req.headers.host;
    const nioPath = "/nio-api/app/api/icar/v2/widget/info?lang=zh-CN&app_id=10002&timestamp=1774198476&app_ver=6.3.0&device_id=14e3f556d3984993a59ad96e8af3ba2d&widget_functions=rvs_set_doorlock%2Crvs_set_air_conditioner%2Crvs_set_tailgate%2Crvs_exe_findme&widget_size=medium&region=cn&vehicle_id=c36736658c7b4b7e8d5a484b8f908b43&sign=7165a503f129317c909169732c6260de";
    const nioUrl = `${protocol}://${host}${nioPath}`;

    const nioHeaders = {
      "Accept": "application/json,text/json,text/plain",
      "User-Agent": "VehicleWidgetExtension/6.3.0 (com.do1.WeiLaiApp.NIOVehicleWidget; build:2586; iOS 26.3.1) Alamofire/5.9.1",
      "Authorization": "Bearer 2.0IkLw1IayXSA5CD32/1MdpTe9sF9zhR5BPmTEA3a2JX0=",
      "Accept-Language": "zh-CN,zh-Hans;q=0.9",
    };

    console.log(`→ Fetching NIO data via: ${nioUrl}`);
    const nioResponse = await fetch(nioUrl, {
      headers: nioHeaders,
      method: "GET",
    });

    if (!nioResponse.ok) {
      throw new Error(`Failed to fetch from NIO API: ${nioResponse.status}`);
    }

    const nioData = await nioResponse.json();

    if (nioData.result_code !== 'success') {
      throw new Error(`NIO API returned error: ${JSON.stringify(nioData)}`);
    }

    console.log("✓ Fetched NIO data successfully");

    // Step 2: Get list of IMAGE_API tasks from dot-mindreset
    const listUrl = `https://dot.mindreset.tech/api/authV2/open/device/${deviceId}/loop/list`;
    const listResponse = await fetch(listUrl, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
    });

    if (!listResponse.ok) {
      const errText = await listResponse.text();
      throw new Error(`Failed to get task list: ${errText}`);
    }

    const tasks = await listResponse.json();
    const imageTasks = tasks.filter((task: any) => task.type === "IMAGE_API");
    console.log(`✓ Found ${imageTasks.length} IMAGE_API tasks`);

    if (imageTasks.length === 0) {
      throw new Error("No IMAGE_API tasks found on device. Please add 11 image tasks in Dot. App content workshop.");
    }

    if (imageTasks.length !== 11) {
      console.warn(`⚠ Expected 11 image tasks, got ${imageTasks.length}`);
    }

    // Step 3: Launch Puppeteer with @sparticuz/chromium
    const chromiumAny = chromium as any;
    const browser = await puppeteer.launch({
      args: [...chromiumAny.args, '--no-sandbox', '--disable-setuid-sandbox'],
      defaultViewport: chromiumAny.defaultViewport,
      executablePath: await chromiumAny.executablePath(),
      headless: chromiumAny.headless,
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800, deviceScaleFactor: 2 });

    // Read the built index.html from local dist folder (no network request needed)
    const indexPath = path.join(process.cwd(), 'dist', 'index.html');
    let html = fs.readFileSync(indexPath, 'utf8');

    // Add base tag to fix asset paths when loading via data URI
    // CSS/JS paths like /assets/... will resolve correctly to the production domain
    const baseTag = '<base href="https://niothing.pintecl.com/">\n';
    // Inject NIO data directly into HTML BEFORE loading page
    // This ensures React sees the data when it initializes
    const injectionScript = `<script>window.__NIO_RAW_DATA__ = ${JSON.stringify(nioData).replace(/</g, '\\u003c')};</script>`;
    // Add base tag in head before closing </head>
    html = html.replace('</head>', `${baseTag}</head>`);
    // Add injection script before closing </body>
    html = html.replace('</body>', `${injectionScript}</body>`);

    // Set HTML content directly - more reliable than data URI
    await page.setContent(html, { waitUntil: 'networkidle0', timeout: 60000 });
    console.log('✓ Loaded local HTML with injected NIO data');

    // Wait longer for JS to load and React to render
    console.log('⟪ Waiting extra time for React to render...');
    await page.waitForTimeout(15000);

    // Debug: dump page HTML to console so we can see what's actually rendered
    console.log('⟪ 1. Getting page content...');
    const pageHtml = await page.content();
    console.log('=== PAGE HTML DEBUG START ===');
    console.log(`✓ Page HTML length: ${pageHtml.length} characters`);
    console.log(`✓ Contains "flex" class: ${pageHtml.includes('flex')}`);
    console.log(`✓ Contains "grid" class: ${pageHtml.includes('grid')}`);
    console.log('✓ Injected script found:', pageHtml.includes('window.__NIO_RAW_DATA__'));
    console.log('=== PAGE HTML DEBUG END ===');

    // Debug: count how many .flex elements we have
    console.log('⟪ 2. Counting .flex elements...');
    const flexCount = await page.evaluate(() => document.querySelectorAll('.flex').length);
    console.log(`✓ Found ${flexCount} .flex elements in the page`);

    // Debug: list each .flex element info
    const flexInfo = await page.evaluate(() => {
      const flexes = Array.from(document.querySelectorAll('.flex'));
      return flexes.map((el, index) => {
        const childCount = el.children.length;
        const className = el.className;
        return { index: index + 1, childCount, className };
      });
    });
    console.log('=== FLEX ELEMENTS DEBUG ===');
    flexInfo.forEach(info => {
      console.log(`✓ .flex:nth-child(${info.index}): ${info.childCount} children, classes="${info.className}"`);
    });
    console.log('=== FLEX ELEMENTS DEBUG END ===');

    // Debug: check if our target selector exists
    console.log(`⟪ 3. Checking target selector: ${WIDGET_SELECTORS[0]}`);
    const targetExists = await page.$(WIDGET_SELECTORS[0]);
    if (targetExists) {
      console.log('✓ Target selector FOUND!');
    } else {
      console.log('✗ Target selector NOT found!');
    }

    // Wait for the first widget to render (we have 11 widgets total)
    console.log('⟪ 4. Waiting for selector...');
    await page.waitForSelector(WIDGET_SELECTORS[0], { timeout: 60000 });
    await page.waitForTimeout(8000);
    console.log('✓ Page rendered, starting screenshots');

    // Step 4: Screenshot each widget and push to device
    const results = [];
    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < Math.min(WIDGET_SELECTORS.length, imageTasks.length); i++) {
      const selector = WIDGET_SELECTORS[i];
      const task = imageTasks[i];

      try {
        const element = await page.$(selector);
        if (!element) {
          throw new Error(`Element not found: ${selector}`);
        }

        const screenshot = await element.screenshot({
          type: 'png',
          omitBackground: false,
        });

        const base64 = screenshot.toString('base64');
        console.log(`✓ Screenshot ${i + 1}/${imageTasks.length} done`);

        // Push to dot-mindreset
        const pushUrl = `https://dot.mindreset.tech/api/authV2/open/device/${deviceId}/image`;
        const pushResponse = await fetch(pushUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            image: base64,
            taskKey: task.key,
            refreshNow: true,
            border: borderNum,
            ditherType: ditherTypeStr,
          }),
        });

        if (pushResponse.ok) {
          successCount++;
          results.push({
            taskKey: task.key,
            name: WIDGET_SELECTORS[i],
            success: true,
          });
          console.log(`✓ Pushed ${i + 1} to task ${task.key}`);
        } else {
          const errText = await pushResponse.text();
          failCount++;
          results.push({
            taskKey: task.key,
            name: WIDGET_SELECTORS[i],
            success: false,
            error: errText,
          });
          console.error(`✗ Failed to push ${i + 1}: ${errText}`);
        }

      } catch (error: any) {
        failCount++;
        results.push({
          index: i,
          success: false,
          error: error.message,
        });
        console.error(`✗ Error on widget ${i}: ${error.message}`);
      }
    }

    await browser.close();
    console.log(`✓ Done: ${successCount} success, ${failCount} fail`);

    // Return results
    res.json({
      success: successCount === imageTasks.length,
      message: `推送完成: ${successCount} 成功, ${failCount} 失败`,
      total_image_tasks: imageTasks.length,
      processed: successCount + failCount,
      success_count: successCount,
      fail_count: failCount,
      configured: {
        device_id: deviceId,
        border: borderNum,
        dither_type: ditherTypeStr,
      },
      results: results,
    });

  } catch (error: any) {
    console.error("✗ Error:", error);
    res.status(500).json({
      error: error.message || "Internal server error",
    });
  }
}
