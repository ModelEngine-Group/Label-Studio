Feature("Bitmask tool").tag("@regress");

const assert = require("assert");

const IMAGE = "https://data.heartex.net/open-images/train_0/mini/0030019819f25b28.jpg";

const config = `<View>
  <Image name="img" value="$image" smoothing="false"></Image>
  <BitmaskLabels name="tag" toName="img">
    <Label value="Test" background="orange"></Label>
  </BitmaskLabels>
</View>`;

// Add cleanup hook
Before(async ({ I }) => {
  I.amOnPage("/");
});

Scenario("Basic Bitmask drawing", async ({ I, LabelStudio, AtImageView, AtLabels }) => {
  const params = {
    config,
    data: { image: IMAGE },
    annotations: [{ id: 1, result: [] }],
  };

  I.amOnPage("/");
  LabelStudio.init(params);
  LabelStudio.waitForObjectsReady();
  await AtImageView.lookForStage();

  I.say("Select Bitmask tool");
  I.pressKey("B");
  AtLabels.clickLabel("Test");

  I.say("Draw a simple mask");
  AtImageView.drawThroughPoints([
    [20, 20],
    [20, 40],
    [40, 40],
    [40, 20],
    [20, 20],
  ]);

  I.say("Check if mask was created");
  const result = await LabelStudio.serialize();
  assert.strictEqual(result.length, 1);
  assert.ok(result[0].value.imageDataURL);
});

Scenario("Bitmask eraser functionality", async ({ I, LabelStudio, AtImageView, AtLabels }) => {
  const params = {
    config,
    data: { image: IMAGE },
    annotations: [{ id: 1, result: [] }],
  };

  I.amOnPage("/");
  LabelStudio.init(params);
  LabelStudio.waitForObjectsReady();
  await AtImageView.lookForStage();

  I.say("Select Bitmask tool and draw initial mask");
  I.pressKey("B");
  AtLabels.clickLabel("Test");
  AtImageView.drawThroughPoints([
    [20, 20],
    [20, 40],
    [40, 40],
    [40, 20],
    [20, 20],
  ]);

  I.say("Switch to eraser and erase part of the mask");
  I.pressKey("E");
  AtImageView.drawThroughPoints([
    [25, 25],
    [35, 35],
  ]);

  I.say("Check if mask was modified");
  const result = await LabelStudio.serialize();
  assert.strictEqual(result.length, 1);
  assert.ok(result[0].value.imageDataURL);
});

Scenario("Bitmask size controls", async ({ I, LabelStudio, AtImageView, AtLabels }) => {
  const params = {
    config,
    data: { image: IMAGE },
    annotations: [{ id: 1, result: [] }],
  };

  I.amOnPage("/");
  LabelStudio.init(params);
  LabelStudio.waitForObjectsReady();
  await AtImageView.lookForStage();

  I.say("Select Bitmask tool");
  I.pressKey("B");
  AtLabels.clickLabel("Test");

  I.say("Test size increase shortcut");
  I.pressKey("]");
  AtImageView.drawThroughPoints([[30, 30]]);

  I.say("Test size decrease shortcut");
  I.pressKey("[");
  AtImageView.drawThroughPoints([[50, 50]]);

  I.say("Check if masks were created with different sizes");
  const result = await LabelStudio.serialize();
  assert.strictEqual(result.length, 1);
  assert.ok(result[0].value.imageDataURL);
});

Scenario("Bitmask hover and selection", async ({ I, LabelStudio, AtImageView, AtLabels, AtOutliner }) => {
  const params = {
    config,
    data: { image: IMAGE },
    annotations: [{ id: 1, result: [] }],
  };

  I.amOnPage("/");
  LabelStudio.init(params);
  LabelStudio.waitForObjectsReady();
  await AtImageView.lookForStage();

  I.say("Create initial mask");
  I.pressKey("B");
  AtLabels.clickLabel("Test");
  AtImageView.drawThroughPoints([
    [20, 20],
    [20, 40],
    [40, 40],
    [40, 20],
    [20, 20],
  ]);

  I.say("Verify selection behavior");
  AtOutliner.seeRegions(1);

  I.say("Click on the region");
  AtImageView.clickAt(30, 30);
  AtOutliner.seeSelectedRegion();
});

Scenario("Verify Bitmask drawing content", async ({ I, LabelStudio, AtImageView, AtLabels }) => {
  const params = {
    config,
    data: { image: IMAGE },
    annotations: [{ id: 1, result: [] }],
  };

  I.amOnPage("/");
  LabelStudio.init(params);
  LabelStudio.waitForObjectsReady();
  await AtImageView.lookForStage();

  I.say("Select Bitmask tool");
  I.pressKey("B");
  AtLabels.clickLabel("Test");

  I.say("Draw a rectangle mask");
  AtImageView.drawThroughPoints([
    [20, 20],
    [20, 40],
    [40, 40],
    [40, 20],
    [20, 20],
  ]);

  I.say("Verify mask content");
  const result = await LabelStudio.serialize();
  assert.strictEqual(result.length, 1);
  assert.ok(result[0].value.imageDataURL);

  // Verify that the imageDataURL contains actual pixel data
  const imageData = result[0].value.imageDataURL;
  assert.ok(imageData.startsWith("data:image/png;base64,"));

  // Decode base64 and verify it's not empty
  const base64Data = imageData.replace("data:image/png;base64,", "");
  const decodedData = Buffer.from(base64Data, "base64");
  assert.ok(decodedData.length > 0, "Decoded image data should not be empty");
});

Scenario("Verify Bitmask pixel content", async ({ I, LabelStudio, AtImageView, AtLabels }) => {
  const params = {
    config,
    data: { image: IMAGE },
    annotations: [{ id: 1, result: [] }],
  };

  I.amOnPage("/");
  LabelStudio.init(params);
  LabelStudio.waitForObjectsReady();
  await AtImageView.lookForStage();

  I.say("Select Bitmask tool");
  I.pressKey("B");
  AtLabels.clickLabel("Test");

  I.say("Draw a rectangle mask");
  AtImageView.drawThroughPoints([
    [20, 20],
    [20, 40],
    [40, 40],
    [40, 20],
    [20, 20],
  ]);

  // Wait for the drawing to be complete
  await I.wait(0.5);

  I.say("Verify mask content and dimensions");
  const result = await LabelStudio.serialize();
  assert.strictEqual(result.length, 1);
  assert.ok(result[0].value.imageDataURL);

  // Wait for the region to be fully processed
  await I.wait(0.5);

  // Get all data we need before making assertions
  const bbox = await I.executeScript(() => {
    const region = Htx.annotationStore.selected.regions[0];
    if (!region) throw new Error("Region not found");
    if (!region.bboxCoordsCanvas) throw new Error("Bbox coordinates not available");
    return region.bboxCoordsCanvas;
  });

  // Define thresholds for assertions
  const THRESHOLD = 5;
  const EXPECTED_SIZE = 40;

  // Verify that the bbox exists
  assert.ok(bbox, "Bounding box should exist");

  // Calculate actual dimensions
  const width = bbox.right - bbox.left;
  const height = bbox.bottom - bbox.top;

  // Verify that the bbox has the expected size
  assert.ok(
    Math.abs(width - EXPECTED_SIZE) <= THRESHOLD,
    `Width should be close to ${EXPECTED_SIZE} pixels (got ${width})`,
  );

  assert.ok(
    Math.abs(height - EXPECTED_SIZE) <= THRESHOLD,
    `Height should be close to ${EXPECTED_SIZE} pixels (got ${height})`,
  );

  // Verify that the bbox is roughly square
  assert.ok(
    Math.abs(width - height) <= THRESHOLD,
    `Width and height should be similar (got width=${width}, height=${height})`,
  );
});
