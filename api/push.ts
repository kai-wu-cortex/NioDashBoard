import type { VercelRequest, VercelResponse } from '@vercel/node';
import puppeteer from 'puppeteer';
import chromium from '@sparticuz/chromium';
import fs from 'fs';
import path from 'path';

// 11 widgets distributed across 3 rows (use IDs on each widget for reliable selection)
const WIDGET_SELECTORS = [
  // Row 1 (3 widgets)
  '#widget-battery', // battery
  '#widget-doorsWindows', // doorsWindows
  '#widget-vehicleDoors', // vehicleDoors
  // Row 2 (4 widgets)
  '#widget-fotaVersion', // fotaVersion
  '#widget-gps', // gps
  '#widget-specialModes', // specialModes
  '#widget-charging', // charging
  // Row 3 (4 widgets)
  '#widget-vehicleInfo', // vehicleInfo
  '#widget-seatHeating', // seatHeating
  '#widget-connection', // connection
  '#widget-temperature', // temperature
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
      headless: 'new', // Use new headless mode as recommended by Puppeteer
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800, deviceScaleFactor: 2 });

    // Read the built files
    const indexPath = path.join(process.cwd(), 'dist', 'index.html');
    let html = fs.readFileSync(indexPath, 'utf8');

    // Read JS and CSS files
    const jsPath = path.join(process.cwd(), 'dist', 'assets', 'index-CZqlCIvn.js');
    const cssPath = path.join(process.cwd(), 'dist', 'assets', 'index-CugxLFBR.css');
    const jsContent = fs.readFileSync(jsPath, 'utf8');
    const cssContent = fs.readFileSync(cssPath, 'utf8');

    // Replace asset references with inline code (use regular script, not module)
    html = html.replace(/<script[^>]*src="\/assets\/[^"]*"[^>]*><\/script>/, `<script>${jsContent}</script>`);
    html = html.replace(/<link[^>]*href="\/assets\/[^"]*"[^>]*>/, `<style>${cssContent}</style>`);

    // Inject NIO data before </head>
    const injectionScript = `<script>window.__NIO_RAW_DATA__ = ${JSON.stringify(nioData).replace(/</g, '\\u003c')};</script>`;
    html = html.replace('</head>', `${injectionScript}</head>`);

    // Set content - wait for load event
    await page.setContent(html, { waitUntil: 'load', timeout: 60000 });
    console.log('✓ Loaded HTML with inline JS/CSS');

    // Wait longer for JS to load and React to render (extra slow on Vercel)
    // Vercel Functions have CPU/network constraints - need more time than local
    console.log('⟪ Waiting for React to render (longer timeout for Vercel)...');

    // Check if React initialized by evaluating in page
    const reactInitialized = await page.evaluate(() => {
      return typeof window !== 'undefined' && typeof window.React !== 'undefined';
    });
    console.log('✓ React initialized:', reactInitialized);

    // Check if __NIO_RAW_DATA__ exists in page
    const hasInjectedData = await page.evaluate(() => {
      return typeof (window as any).__NIO_RAW_DATA__ !== 'undefined';
    });
    console.log('✓ __NIO_RAW_DATA__ exists:', hasInjectedData);

    await page.waitForTimeout(50000);

    // Debug: dump page HTML to console so we can see what's actually rendered
    console.log('⟪ 1. Getting page content...');
    const pageHtml = await page.content();
    console.log('=== PAGE HTML DEBUG START ===');
    console.log(`✓ Page HTML length: ${pageHtml.length} characters`);
    console.log(`✓ Contains "flex" class: ${pageHtml.includes('flex')}`);
    console.log(`✓ Contains "grid" class: ${pageHtml.includes('grid')}`);
    console.log('✓ Injected script found:', pageHtml.includes('window.__NIO_RAW_DATA__'));
    // Check if all widget IDs exist
    const hasFirstWidget = pageHtml.includes('widget-battery');
    console.log('✓ widget-battery id found:', hasFirstWidget);
    // Full HTML output for debugging when missing
    if (!hasFirstWidget) {
      console.log('⚠️ FULL HTML DUMP:');
      console.log(pageHtml);
    }
    console.log('=== PAGE HTML DEBUG END ===');

    // Wait for the first widget to render with polling
    // We already know from page.content() that element should exist in HTML
    console.log(`⟪ Polling for first widget selector: ${WIDGET_SELECTORS[0]}`);

    // Debug: check document ready state
    const readyState = await page.evaluate(() => document.readyState);
    console.log('✓ Document ready state:', readyState);

    // Debug: check if document body has any content
    const bodyHtml = await page.evaluate(() => document.body ? document.body.innerHTML.length : 0);
    console.log('✓ Body HTML length:', bodyHtml);

    // Debug: check for any elements with id starting with "widget-"
    const widgetElements = await page.evaluate(() => {
      const widgets = document.querySelectorAll('[id^="widget-"]');
      return Array.from(widgets).map(el => el.id);
    });
    console.log('✓ Found widget elements:', widgetElements);

    // Poll using page.evaluate (more reliable than waitForSelector on dynamic content)
    // Poll until element exists AND is not empty (has rendered children)
    let elementReady = false;
    for (let i = 0; i < 60; i++) {
      elementReady = await page.evaluate((selector: string) => {
        const id = selector.slice(1); // remove #
        const element = document.getElementById(id);
        // Check that element exists AND has children (rendered by React)
        return element !== null && element.children.length > 0;
      }, WIDGET_SELECTORS[0]);
      if (elementReady) {
        break;
      }
      await page.waitForTimeout(1000);
    }

    console.log(`✓ Debug: ${WIDGET_SELECTORS[0]} is ready: ${elementReady}`);

    if (!elementReady) {
      // Even if not ready, check if it at least exists
      const elementExists = await page.evaluate((selector: string) => {
        const id = selector.slice(1);
        return document.getElementById(id) !== null;
      }, WIDGET_SELECTORS[0]);
      console.log(`⚠ Element exists but not ready: ${elementExists}. Continuing anyway...`);
      // Don't throw error - sometimes it's already rendered but children are empty, let's try screenshot anyway
    }

    // Extra wait for all widgets to complete rendering
    await page.waitForTimeout(10000);
    console.log('✓ Page rendered, starting screenshots');

    // Step 4: Screenshot each widget and push to device
    const results = [];
    let successCount = 0;
    let failCount = 0;

    // Add extra robustness: retry failed widgets once
    for (let i = 0; i < Math.min(WIDGET_SELECTORS.length, imageTasks.length); i++) {
      const selector = WIDGET_SELECTORS[i];
      const task = imageTasks[i];

      try {
        // First attempt
        let element = await page.$(selector);
        
        // If not found, wait and retry once
        if (!element) {
          console.log(`⚠ ${selector} not found on first try, waiting 5s and retrying...`);
          await page.waitForTimeout(5000);
          element = await page.$(selector);
        }

        if (!element) {
          // Final check using evaluate to confirm it exists
          const exists = await page.evaluate((sel) => {
            const id = sel.slice(1);
            return document.getElementById(id) !== null;
          }, selector);
          throw new Error(`Element not found: ${selector} (exists in HTML: ${exists})`);
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
          selector: selector,
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
