---
title: Prompts examples
short: Examples
tier: enterprise
type: guide
order: 0
order_enterprise: 236
meta_title: Prompts examples
meta_description: Example use cases for Prompts
section: Prompts
date: 2025-01-15 12:11:22
---


## Autolabel image captions 

This example demonstrates how to set up Prompts to predict image captions.

1. [Create a new label studio project](setup_project) by importing image data via [cloud storage](storage). 

!!! note
    Prompts does not currently support image data uploaded as raw images. Only image references (HTTP URIs to images) or images imported via cloud storage are supported. 

!!! info Tip
    If you’d like to, you can generate a dataset to test the process using [https://data.heartex.net](https://data.heartex.net).

2. Create a [label config](setup) for image captioning, for example:

```xml
<View>
  <Image name="image" value="$image"/>
  <Header value="Describe the image:"/>
  <TextArea name="caption" toName="image" placeholder="Enter description here..."
            rows="5" maxSubmissions="1"/>
</View>
```
3. Navigate to **Prompts** from the sidebar, and [create a prompt](prompts_create) for the project

!!! note
    If you have not yet set up API the keys you want to use, do that now: [API keys](prompts_create#Model-provider-API-keys). 

4. Add the instruction you’d like to provide the LLM to caption your images. For example:

    *Explain the contents of the following image: `{image}`*

!!! note
    Ensure you include `{image}` in your instructions. Click `image` above the instruction field to insert it. 

![Screenshot pointing to how to insert image into your instructions](/images/prompts/example_insert_image.png)

!!! info Tip
    You can also automatically generate the instructions using the [**Enhance Prompt** action](prompts_draft#Enhance-prompt). Before you can use this action, you must at least add the variable name `{image}` and then click **Save**. 

![Screenshot pointing to Enhance Prompt action](/images/prompts/example_enhance_prompt.png)

5. Run the prompt. View predictions to accept or correct.

    You can [read more about evaluation metrics](prompts_draft#Evaluation-results) and ways to assess your prompt performance. 

!!! info Tip
    Use the drop-down menu above the results field to change the subset of data being used (e.g. only data with Ground Truth annotations, or a small sample of records). 

![Screenshot pointing to subset dropdown](/images/prompts/example_subset.png)

6. Accept the [predictions as annotations](prompts_predictions#Create-annotations-from-predictions).


## Evaluate LLM outputs for toxicity

This example demonstrates how to set up Prompts to evaluate if the LLM-generated output text is classified as harmful, offensive, or inappropriate.

1. [Create a new label studio project](setup_project) by importing text data of LLM-generated outputs. 

    You can use this preprocessed sample of the [jigsaw_toxicity](https://huggingface.co/datasets/tasksource/jigsaw_toxicity) dataset as an example. See [the appendix](#Appendix-Generate-dataset) for how this was generated. 
2. Create a [label config](setup) for toxicity detection, for example:

```xml
<View>
  <Header value="Comment" />
  <Text name="comment" value="$comment_text"/>
  
  <Header value="Toxic" size="3"/>
  <Choices name="toxic" toName="comment" choice="single" showInline="true">
    <Choice value="Yes" alias="1"/>
    <Choice value="No" alias="0"/>
  </Choices>
  <Header value="Severely Toxic" size="3"/>
  <Choices name="severe_toxic" toName="comment" choice="single" showInline="true">
    <Choice value="Yes" alias="1"/>
    <Choice value="No" alias="0"/>
  </Choices>
  <Header value="Insult" size="3"/>
  <Choices name="insult" toName="comment" choice="single" showInline="true">
    <Choice value="Yes" alias="1"/>
    <Choice value="No" alias="0"/>
  </Choices>
  <Header value="Threat" size="3"/>
  <Choices name="threat" toName="comment" choice="single" showInline="true">
    <Choice value="Yes" alias="1"/>
    <Choice value="No" alias="0"/>
  </Choices>
  <Header value="Obscene" size="3"/>
  <Choices name="obscene" toName="comment" choice="single" showInline="true">
    <Choice value="Yes" alias="1"/>
    <Choice value="No" alias="0"/>
  </Choices>
  <Header value="Identity Hate" size="3"/>
  <Choices name="identity_hate" toName="comment" choice="single" showInline="true">
    <Choice value="Yes" alias="1"/>
    <Choice value="No" alias="0"/>
  </Choices>
  
  <Header value="Reasoning" size="3"/>
  <TextArea name="reasoning" toName="comment" editable="true" placeholder="Provide reasoning for your choices here..."/>
</View>
```

3. Navigate to **Prompts** from the sidebar, and [create a prompt](prompts_create) for the project

!!! note
    If you have not yet set up API the keys you want to use, do that now: [API keys](prompts_create#Model-provider-API-keys). 

4. Add the instruction you’d like to provide the LLM to best evaluate the text. For example:

    *Determine whether the following text falls into any of the following categories (for each, provide a "0" for False and "1" for True):*
    
    *toxic, severe_toxic, insult, threat, obscene, and identity_hate.*

    *Comment:*

    *`{comment_text}`*


!!! note
    Ensure you include `{comment_text}` in your instructions. Click `comment_text` above the instruction field to insert it. 

![Screenshot pointing to how to insert comment text into your instructions](/images/prompts/example_insert_comment_text.png)

!!! info Tip
    You can also automatically generate the instructions using the [**Enhance Prompt** action](prompts_draft#Enhance-prompt). Before you can use this action, you must at least add the variable name `{comment_text}` and then click **Save**. 

![Screenshot pointing to Enhance Prompt action](/images/prompts/example_enhance_prompt2.png)

5. Run the prompt. View predictions to accept or correct.

    You can [read more about evaluation metrics](prompts_draft#Evaluation-results) and ways to assess your prompt performance. 

!!! info Tip
    Use the drop-down menu above the results field to change the subset of data being used (e.g. only data with Ground Truth annotations, or a small sample of records). 

![Screenshot pointing to subset dropdown](/images/prompts/example_subset2.png)

6. Accept the [predictions as annotations](prompts_predictions#Create-annotations-from-predictions). 

### Appendix: Generate dataset

Download the jigsaw_toxicity dataset, then downsample/format using the following script (modify the `INPUT_PATH` and `OUTPUT_PATH` to suit your needs):

```python
import pandas as pd
import json


def gen_task(row):
    labels = [
        {
            "from_name": field,
            "to_name": "comment",
            "type": "choices",
            "value": {"choices": [str(int(row._asdict()[field]))]},
        }
        for field in [
            "toxic",
            "severe_toxic",
            "insult",
            "threat",
            "obscene",
            "identity_hate",
        ]
    ]
    return {
        "data": {"comment_text": row.comment_text},
        "annotations": [
            {
                "result": labels,
                "ground_truth": True,
                "was_cancelled": False,
            }
        ],
    }


INPUT_PATH = "/Users/pakelley/Downloads/Jigsaw Toxicity Train.csv"
OUTPUT_PATH = "/Users/pakelley/Downloads/toxicity-sample-ls-format.json"

df = pd.read_csv(INPUT_PATH)
sample = df.sample(n=100)
label_studio_tasks = [gen_task(row) for row in sample.itertuples()]
with open(OUTPUT_PATH, "w") as f:
    json.dump(label_studio_tasks, f)
```

If you choose to, you could also easily change how many records to use (or use the entire dataset by removing the sample step). 