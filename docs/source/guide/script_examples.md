---
title: Custom script examples
short: Custom script examples
tier: enterprise
type: guide
order: 0
order_enterprise: 109
section: "Create & Manage Projects"
parent: "scripts"
parent_enterprise: "scripts"
date: 2024-07-30 13:31:47
---

The following examples work when [custom scripts](scripts) are enabled. 

For details on implementing your own custom scripts, see [Label Studio Interface (LSI)](scripts#Label-Studio-Interface-LSI) and [Frontend API implementation details](scripts#Frontend-API-implementation-details). 

!!! info Tip
    You can find additional script examples in our [label-studio-custom-scripts repo](https://github.com/HumanSignal/label-studio-custom-scripts).

## Plotly

Use [Plotly](https://plotly.com/) to insert charts and graphs into your labeling interface. Charts are rendered in every annotation opened by a user. 

Plotly should be loaded first from CDN: https://cdn.plot.ly/plotly-2.26.0.min.js. For security reasons, it's better to use a hash for script integrity. 


![Screenshot of Plotly graph in Label Studio](/images/project/plotly.png)

#### Script

```javascript
await LSI.import('https://cdn.plot.ly/plotly-2.26.0.min.js', 'sha384-xuh4dD2xC9BZ4qOrUrLt8psbgevXF2v+K+FrXxV4MlJHnWKgnaKoh74vd/6Ik8uF',);

let data = LSI.task.data;
if (window.Plotly && data) {
  Plotly.newPlot("plot", [data.plotly]);
}
```

**Related LSI instance methods:**

* [import(url, integrity)](scripts#import-url-integrity)


#### Labeling config

You need to add `<View idAttr="plot"/>` into your config to render the Plotly chart. 

For example:

```xml
<View>
  <Text name="function" value="Is it increasing?" />
  <Choices name="slope" toName="function">
    <Choice value="Increasing" />
    <Choice value="Decreasing" />
    <Choice value="Non-monotonic" />
  </Choices>
  <View idAttr="plot"/>
</View>
```

**Related tags:**

* [View](/tags/view.html)
* [Text](/tags/text.html)
* [Choices](/tags/choices.html)
* [Choice](/tags/choice.html)

#### Data

```json
[
  {
    "plotly": {
      "x": [1, 2, 3, 4],
      "y": [10, 15, 13, 17],
      "type": "scatter"
    }
  },
  {
    "plotly": {
      "x": [1, 2, 3, 4],
      "y": [16, 5, 11, 9],
      "type": "scatter"
    }
  }
]
```

## Custom validation

In this example, the script checks to ensure that the annotation does not include obscenity or disallowed words. 

The following script displays a modal if a user tries to submit an annotation with the word “hate” added to any audio transcription. 

Note that this is a "soft" block, meaning that the user can dismiss the modal and still proceed. For an example of a "hard" block, see [Check that TextArea input is valid JSON](#Check-that-TextArea-input-is-valid-JSON) below. 

![Screenshot of custom validation modal in Label Studio](/images/project/script_validation.png)

#### Script

```javascript
// Use Label Studio Interface to subscribe to events
// before Save Annotation is an event invoked before submitting and updating annotation
// returning "false" for this event prevents saving annotation

let dismissed = false;

LSI.on("beforeSaveAnnotation", (store, ann) => {
  // text in TextArea is always an array
  const obscene = ann.results.find(
  r => r.type === 'textarea' && r.value.text.some(t => t.includes('hate'))
  );
  if (!obscene || dismissed) return true;
  // select region to see textarea
  if (!obscene.area.classification) ann.selectArea(obscene.area);
  Htx.showModal("The word 'hate' is disallowed","error");
  dismissed = true;
  return false;
});
```

**Related LSI instance methods:**

* [on(eventName, handler)](scripts#on-eventName-handler)
  
**Related frontend events:**

* [beforeSaveAnnotation](frontend_reference#beforeSaveAnnotation)

#### Labeling config

```xml
<View>
  <Labels name="labels" toName="audio">
    <Label value="Speech" />
    <Label value="Noise" />
  </Labels>

  <Audio name="audio" value="$audio"/>

  <TextArea name="transcription" toName="audio"
    editable="true"
    perRegion="true"
    required="true"
  />
</View>
```

**Related tags:**

* [View](/tags/view.html)
* [Labels](/tags/labels.html)
* [Audio](/tags/audio.html)
* [TextArea](/tags/textarea.html)

#### Data

```json
[
  {
    "audio": "https://data.heartex.net/librispeech/dev-clean/3536/8226/3536-8226-0024.flac.wav"
  }
]
```

## Bulk text labeling with regex

This script automatically applies the same label to all matching text spans. For example, if you apply the `PER` label to the text span `Smith`, this script will automatically find all instances of `Smith` in the text and apply the `PER` label to them. 

![Screenshot of bulk text labeling](/images/project/autolabeling.gif)

#### Script

```javascript
LSI.on('entityCreate', region => {
  if (window.BULK_REGIONS) return;
  window.BULK_REGIONS = true;

  const regionTextLength = region.text.length;
  const regex = new RegExp(region.text, "gi");
  const matches = Array.from(region.object._value.matchAll(regex));

  setTimeout(() => window.BULK_REGIONS = false, 1000);

  if (matches.length > 1) {
    const results = matches.reduce((acc, m) => {
      if (m.index !== region.startOffset) {
        acc.push({
          id: String(Htx.annotationStore.selected.results.length + acc.length + 1),
          from_name: region.labeling.from_name.name,
          to_name: region.object.name,
          type: "labels",
          value: {
            text: region.text,
            start: "/span[1]/text()[1]",
            startOffset: m.index,
            end: "/span[1]/text()[1]",
            endOffset: m.index + regionTextLength,
            labels: [...region.labeling.value.labels], 
          },
          origin: "manual",
        
        });
      }
      return acc;
    }, []);

    if (results.length > 0) {
      Htx.annotationStore.selected.deserializeResults(results);
      Htx.annotationStore.selected.updateObjects();
    }
  }
});
```

**Related LSI instance methods:**

* [on(eventName, handler)](scripts#on-eventName-handler)

**Related frontend events:**

* [entityCreate](frontend_reference#entityCreate)

#### Labeling config

```xml
<View>
  <Labels name="label" toName="text">
    <Label value="PER" background="red"/>
    <Label value="ORG" background="darkorange"/>
    <Label value="LOC" background="orange"/>
    <Label value="MISC" background="green"/>
  </Labels>

  <Text name="text" value="$text"/>
</View>
```

**Related tags:**

* [View](/tags/view.html)
* [Text](/tags/text.html)
* [Labels](/tags/labels.html)


## Bulk creation and deletion operations with keyboard shortcut

This script adds bulk operations for creating and deleting regions (annotations) based on the state of the **Shift** key:

1. **Shift Key Tracking**
    - The script tracks the state of the Shift key using `keydown` and `keyup` event listeners. A boolean variable `isShiftKeyPressed` is set to `true` when the Shift key is pressed and `false` when it is released.
2. **Bulk Deletion of Regions**
    - When a region (annotation) is deleted and the Shift key is pressed, the script identifies all regions with the same text and label as the deleted region.
    - It then deletes all these matching regions to facilitate bulk deletion.
3. **Bulk Creation of Regions**
    - When a region is created and the Shift key is pressed, the script searches for all occurrences of the created region's text within the document.
    - It creates new regions for each occurrence of the text, ensuring that no duplicate regions are created (i.e., regions with overlapping start and end offsets are avoided).
    - The script also prevents tagging of single characters to avoid unnecessary annotations.
4. **Debouncing Bulk Operations**
    - To prevent rapid consecutive bulk operations, the script uses a debouncing mechanism with a timeout of 1 second. This ensures that bulk operations are not triggered too frequently.

![Screenshot of bulk actions with keyboard shortcut](/images/project/bulk_actions.gif)

#### Script

```javascript
 // Track the state of the shift key
 let isShiftKeyPressed = false;

 window.addEventListener('keydown', (e) => {
   if (e.key === 'Shift') {
     isShiftKeyPressed = true;
   }
 });

 window.addEventListener('keyup', (e) => {
   if (e.key === 'Shift') {
     isShiftKeyPressed = false;
   }
 });


 LSI.on('entityDelete', region => {
   if (!isShiftKeyPressed) return; // Only proceed if the shift key is pressed

   if (window.BULK_REGIONS) return;
   window.BULK_REGIONS = true;
   setTimeout(() => window.BULK_REGIONS = false, 1000);

   const existingEntities = Htx.annotationStore.selected.regions;
   const regionsToDelete = existingEntities.filter(entity => {
     const deletedText = region.text.toLowerCase().replace("\\\\n", " ")
     const otherText = entity.text.toLowerCase().replace("\\\\n", " ")
     console.log(deletedText)
     console.log(otherText)
     return deletedText === otherText && region.labels[0] === entity.labels[0]
   });

   regionsToDelete.forEach(r => {
     Htx.annotationStore.selected.deleteRegion(r);
   });

   Htx.annotationStore.selected.updateObjects();
 });


 LSI.on('entityCreate', region => {
   if (!isShiftKeyPressed) return; 

   if (window.BULK_REGIONS) return;
   window.BULK_REGIONS = true;
   setTimeout(() => window.BULK_REGIONS = false, 1000);

   const existingEntities = Htx.annotationStore.selected.regions;

   setTimeout(() => {
     // Prevent tagging a single character
     if (region.text.length < 2) return;
     regexp = new RegExp(region.text.replace("\\\\n", "\\\\s+").replace(" ", "\\\\s+"), "gi")
     const matches = Array.from(region.object._value.matchAll(regexp));
     matches.forEach(m => {
       if (m.index === region.startOffset) return;

       const startOffset = m.index;
       const endOffset = m.index + region.text.length;

       // Check for existing entities with overlapping start and end offset
       let isDuplicate = false;
       for (const entity of existingEntities) {
         if (startOffset <= entity.globalOffsets.end && entity.globalOffsets.start <= endOffset) {
           isDuplicate = true;
           break;
         }
       }

       if (!isDuplicate) {
         Htx.annotationStore.selected.createResult({
             text: region.text,
             start: "/span[1]/text()[1]",
             startOffset: startOffset,
             end: "/span[1]/text()[1]",
             endOffset: endOffset
           }, {
             labels: [...region.labeling.value.labels]
           },
           region.labeling.from_name,
           region.object
         );
       }
     });

     Htx.annotationStore.selected.updateObjects();
   }, 100);
 });
```

**Related LSI instance methods:**

* [on(eventName, handler)](scripts#on-eventName-handler)

**Related frontend APIs:**

* [regions](scripts#regions)
  
**Related frontend events:**

* [entityCreate](frontend_reference#entityCreate)
* [entityDelete](frontend_reference#entityDelete)



#### Labeling config

```xml
<View>
  <Header>
    Labels
  </Header>
 <View style="padding: 0em 1em; background: #f1f1f1; margin-right: 1em; border-radius: 3px">
  <View style="position: sticky; top: 0; height: 50px; overflow: auto;">
    <Labels name="label" toName="text">
      <Label value="type_1" background="#3a1381"/>
      <Label value="type_2" background="#FFA39E"/>
      <Label value="type_3" background="#46ae19"/>
      <Label value="type_4" background="#8ab1c1"/>
     </Labels>
        </View>
  </View>
  <Header>
    Document
  </Header>
  <View style="height: 600px; overflow: auto;">
    <Text name="text" value="$text"/>
  </View>
</View>
```

**Related tags:**

* [View](/tags/view.html)
* [Text](/tags/text.html)
* [Header](/tags/header.html)
* [Labels](/tags/labels.html)

## Check that TextArea input is valid JSON 

This script parses the contexts of a TextArea field to check for valid JSON. If the JSON is invalid, it shows an error and prevents the annotation from being saved.

This is an example of a "hard" block, meaning that the user must resolve the issue before they can proceed. For an example of a "soft" block, see [Custom validation](#Custom-validation) above. 

![Screenshot of JSON error message](/images/project/script_json.png)

#### Script

```javascript
 LSI.on("beforeSaveAnnotation", (store, annotation) => {
  const textAreaResult = annotation.results.find(r => r.type === 'textarea' && r.from_name.name === 'answer');
  if (textAreaResult) {
    try {
      JSON.parse(textAreaResult.value.text[0]);
    } catch (e) {
      Htx.showModal("Invalid JSON format. Please correct the JSON and try again.", "error");
      return false;
    }
  }
  return true;
});
```

**Related LSI instance methods:**

* [on(eventName, handler)](scripts#on-eventName-handler)

**Related frontend events:**

* [beforeSaveAnnotation](frontend_reference#beforeSaveAnnotation)


#### Labeling config

```xml
<View>
  <View>
    <Filter toName="label_rectangles" minlength="0" name="filter"/>
    <RectangleLabels name="label_rectangles" toName="image" canRotate="false" smart="true">
      <Label value="table" background="Blue"/>
      <Label value="cell" background="Red"/>
      <Label value="column" background="Green"/>
      <Label value="row" background="Purple"/>
    </RectangleLabels>
  </View>
  <View>
    <Image name="image" value="$image" />
  </View>
  <View style=".htx-text { white-space: pre-wrap; }">
    <TextArea name="answer" toName="image"
              editable="true"
              perRegion="true"
              required="false"
              maxSubmissions="1"
              rows="10"
              placeholder="Parsed Row JSON"
              displayMode="tag"/>
  </View>
</View>
```

**Related tags:**

* [View](/tags/view.html)
* [RectangleLabels](/tags/rectanglelabels.html)
* [TextArea](/tags/textarea.html)
* [Labels](/tags/labels.html)

## Sync videos with frame offset

This labeling configuration arranges three video players vertically, making it easier to view and annotate each video frame. 

The script ensures the videos are synced, with one player showing one frame forward, and another player the previous frame. 

![Screenshot of JSON error message](/images/project/video_sync.png)

#### Script

```javascript
// Wait for the Label Studio Interface to be ready
await LSI;

// Get references to the video objects by their names
var videoMinus1 = LSI.annotation.names.get('videoMinus1');
var video0 = LSI.annotation.names.get('video0');
var videoPlus1 = LSI.annotation.names.get('videoPlus1');

if (!videoMinus1 || !video0 || !videoPlus1) return;

// Convert frameRate to a number and ensure it's valid
var frameRate = Number.parseFloat(video0.framerate) || 24;
var frameDuration = 1 / frameRate;

// Function to adjust video sync with offset and guard against endless loops
function adjustVideoSync(video, offsetFrames) {
  video.isSyncing = false;
  
  ["seek", "play", "pause"].forEach(event => {
    video.syncHandlers.set(event, function(data) {
      if (video.isSyncing) return;
      
      video.isSyncing = true;

      if (!video.ref.current || video === video0) {
        video.isSyncing = false;
        return;
      }
	  
      const videoElem = video.ref.current;
      
      adjustedTime = (video0.ref.current.currentFrame + offsetFrames) * frameDuration;
      adjustedTime = Math.max(0, Math.min(adjustedTime, video.ref.current.duration));
      
      if (data.playing) {
        if (!videoElem.playing) videoElem.play();
      } else {
        if (videoElem.playing) videoElem.pause();
      }

      if (data.speed) {
        video.speed = data.speed;
      }

      videoElem.currentTime = adjustedTime;
      if (Math.abs(videoElem.currentTime - adjustedTime) > frameDuration/2) {
        videoElem.currentTime = adjustedTime;
      }

      video.isSyncing = false;
    });
  });
}

// Adjust offsets for each video
adjustVideoSync(videoMinus1, -1);
adjustVideoSync(videoPlus1, 1);
adjustVideoSync(video0, 0);
```

**Related LSI instance methods:**

* [annotation](scripts#LSI-annotation)

#### Labeling config

Each video is wrapped in a `<View>` tag with a width of 100% to ensure they stack on top of each other. The `Header` tag provides a title for 
each video, indicating which frame is being displayed. 

The `Video` tags are used to load the video content, with the `name` attribute uniquely identifying each video player. 

The `TimelineLabels` tag is connected to the second video (`video0`), allowing annotators to label specific segments of that video. The labels `class1` and `class2` can be used to categorize the content of the video, enhancing the  annotation process. 

```xml
<View>
  <View style="display: flex">
  <View style="width: 100%">
    <Header value="Video -1 Frame"/>
    <Video name="videoMinus1" value="$video_url" 
           height="200" sync="lag" frameRate="29.97"/>
  </View>
  <View style="width: 100%">
    <Header value="Video +1 Frame"/>
    <Video name="videoPlus1" value="$video_url" 
           height="200" sync="lag" frameRate="29.97"/>
  </View>
  </View>
  <View style="width: 100%; margin-bottom: 1em;">
    <Header value="Video 0 Frame"/>
    <Video name="video0" value="$video_url"
           height="400" sync="lag" frameRate="29.97"/>
  </View>
  <TimelineLabels name="timelinelabels" toName="video0">
    <Label value="class1"/>
    <Label value="class2"/>
  </TimelineLabels>
</View>
```

**Related tags:**

* [View](/tags/view.html)
* [Video](/tags/video.html)
* [TimelineLabels](/tags/timelinelabels.html)
* [Label](/tags/label.html)

#### Data

```json
{
  "data": {
    "video_url": "https://example.com/path/to/video.mp4"
  }
}
```

## Pause an annotator

You can manually [pause an annotator](quality#Pause-an-annotator) to prevent stop them from completing tasks and revoke their project access. 

This script automatically pauses an annotator who breaks any of the following rules and customizes the message that appears:

* Too many duplicate values `timesInARow(3)`:

    Checks if the last three submitted annotations in the `TextArea` field (`comment`) all have the same value. If they do, it returns a custom warning message. 

    ![Screenshot of warning](/images/project/scripts_pause1.png)

* Too many similar values `tooSimilar()`: 

    For the `Choices` options (`sentiment`), it computes a deviation over the past values. If the deviation is below a threshold (meaning the values are too uniform/similar), it returns a custom warning message. 

    ![Screenshot of warning](/images/project/scripts_pause2.png)
 
* Too many submissions over a period of time `tooFast()`: 

    Monitors the overall speed of annotations. It checks if, for example, 20 annotations were submitted in less than 10 minutes. If so, a custom warning appears. 

    ![Screenshot of warning](/images/project/scripts_pause3.png)

To unpause an annotator, use the [Members dashboard](quality#Pause-an-annotator). 

!!! info Tip

    If you hover over the **Paused** indicator, you can see the message that was shown to the user when they were paused. If a user was manually paused, it also shows who initiated the action.  

    ![Screenshot of hover](/images/project/scripts_pause_hover.png)

#### Script

```javascript
/****** CONFIGURATION FOR PAUSING RULES ******/
/**
 * `fields` describe per-field rules in a format
 *   <field-name>: [<rule>(<optional params for the rule>)]
 * `global` is for rules applied to the whole annotation
 */
const RULES = {
  fields: {
    comment: [timesInARow(3)],
    sentiment: [tooSimilar()],
  },
  global: [tooFast()],
}
/**
 * Messages for users when they are paused.
 * Each message is a function with the same name as original rule and it receives an object with
 * `items` and `field`.
 */
const MESSAGES = {
  timesInARow: ({ field }) => `Too many similar values for ${field}`,
  tooSimilar: ({ field }) => `Too similar values for ${field}`,
  tooFast: () => `Too fast annotations`,
}



/****** ALL AVAILABLE RULES ******/
/**
 * They recieve params and return function which recieves `items` and optional `field`.
 * If condition is met it returns warning message. If not — returns `false`.
 */

// check if values for the `field` in last `times` items are the same
function timesInARow(times) {
  return (items, field) => {
    if (items.length < times) return false
    const last = String(items.at(-1).values[field])
    return items.slice(-times).every((item) => String(item.values[field]) === last)
      ? MESSAGES.timesInARow({ items, field })
      : false
  };
}
function tooSimilar(deviation = 0.1, max_count = 10) {
  return (items, field) => {
    if (items.length < max_count) return false
    const values = items.map((item) => item.values[field])
    const points = values.map((v) => values.indexOf(v))
    return calcDeviation(points) < deviation
      ? MESSAGES.tooSimilar({ items, field })
      : false
  };
}
function tooFast(minutes = 10, times = 20) {
  return (items) => {
    if (items.length < times) return false
    const last = items.at(-1)
    const first = items.at(-times)
    return last.created_at - first.created_at < minutes * 60
      ? MESSAGES.tooFast({ items })
      : false
  };
}

/****** INTERNAL CODE ******/
const project = DM.project.id
if (!DM.project) return;

const key = ["__pause_stats", project].join("|")
const fields = Object.keys(RULES.fields)
// { sentiment: ["positive", ...], comment: undefined }
const values = Object.fromEntries(fields.map(
  (field) => [field, DM.project.parsed_label_config[field]?.labels],
))

// simplified version of MSE with normalized x-axis
function calcDeviation(data) {
  const n = data.length;
  // we normalize indices from -n/2 to n/2 so meanX is 0
  const mid = n / 2;
  const mean = data.reduce((a, b) => a + b) / n;

  const k = data.reduce((a, b, i) => a + (b - mean) * (i - mid), 0) / data.reduce((a, b, i) => a + (i - mid) ** 2, 0);
  const mse = data.reduce((a, b, i) => a + (b - (k * (i - mid) + mean)) ** 2, 0) / n;

  return Math.abs(mse);
}

LSI.on("submitAnnotation", (_store, ann) => {
  const results = ann.serializeAnnotation()
  // { sentiment: "positive", comment: "good" }
  const values = {}
  fields.forEach((field) => {
    const value = results.find((r) => r.from_name === field)?.value
    if (!value) return;
    if (value.choices) values[field] = value.choices.join("|")
    else if (value.text) values[field] = value.text
  })
  let stats = []
  try {
    stats = JSON.parse(localStorage.getItem(key)) ?? []
  } catch(e) {}
  stats.push({ values, created_at: Date.now() / 1000 })

  for (const rule of RULES.global) {
    const result = rule(stats)
    if (result) {
      localStorage.setItem(key, "[]");
      pause(result);
      return;
    }
  }

  for (const field of fields) {
    if (!values[field]) continue;
    for (const rule of RULES.fields[field]) {
      const result = rule(stats, field)
      if (result) {
        localStorage.setItem(key, "[]");
        pause(result);
        return;
      }
    }
  }

  localStorage.setItem(key, JSON.stringify(stats));
});

function pause(verbose_reason) {
  const body = {
    reason: "CUSTOM_SCRIPT",
    verbose_reason,
  }
  const options = {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }
  fetch(`/api/projects/${project}/members/${Htx.user.id}/pauses`, options)
}
```

**Related LSI instance methods:**

* [on(eventName, handler)](scripts#on-eventName-handler)
  
**Related frontend events:**

* [submitAnnotation](frontend_reference#submitAnnotationn)

#### Labeling config

This labeling config presents users with text and asks them to:

* Provide a sentiment value using `<Choices>`
* Comment on their reasoning using `<TextArea>`

```xml
<View>
  <Text name="text" value="$text"/>
  <View style="box-shadow: 2px 2px 5px #999; padding: 20px; margin-top: 2em; border-radius: 5px;">
    
    <Header value="What is the sentiment of this text?" />
    <Choices name="sentiment" toName="text" choice="single" showInLine="true">
      <Choice value="positive" hotkey="1" />
      <Choice value="negative" hotkey="2" />
      <Choice value="neutral" hotkey="3" />
    </Choices>

    <Header value="Why?" />
    <TextArea name="comment" toName="text" rows="4" placeholder="Add your comment here..." />
  
  </View>
</View>

```

**Related tags:**

* [View](/tags/view.html)
* [Text](/tags/text.html)
* [Header](/tags/header.html)
* [Choices](/tags/choices.html)
* [TextArea](/tags/textarea.html)