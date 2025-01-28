---
title: About Ask AI - Beta 🧪
short: Ask AI
tier: enterprise
type: guide
order: 0
order_enterprise: 356
meta_title: About Ask AI 
meta_description: Information about using the Ask AI tool in Label Studio
section: "Manage Your Organization"
date: 2025-01-28 16:40:16
---

The Ask AI tool is an LLM that has been trained on our documentation, codebase, and several other Label Studio resources. 

You can use Ask AI to create or refine your labeling configuration. Instead of manually building labeling interfaces or project instructions from scratch, you can prompt the AI with a description of what your labeling project needs, and the AI generates a suggested configuration. 


## What models do you use?

We use a combination of Open Source LLMs hosted by HumanSignal and hosted LLMs from OpenAI's GPT series of models.

## What data is used to generate answers?

Only the data you provide in the chat window is used to generate responses, this includes:

• All chat messages
• Task samples you have uploaded
• The current labeling config

Only the chat history, tasks, and labelling configuration from the current project are used.

## How is my data used to train models?

The model is trained on public resources like our documentation, codebase, blog, and website. We also train it on additional examples we've written specifically for the the model. 

We are on a Tier 5 OpenAI account, and opt out of all requests for training data.

We track requests to Ask AI to use as quality control, but they are only used to test the outputs of the model.  For example: If Company X asks "Make a project to label opossums," we may notice that Ask AI did not provide a satisfactory answer and we may create configurations with opossums in them and train the model on them. The model would not be trained on any of Company X's questions or data.

All tracked data is covered by our industry-leading [security and privacy policies](https://humansignal.com/security/).

## Can I disable Ask AI?

Yes, contact us to disable this feature.

## HIPAA compliance

Your Business Associate Agreement (BAA) does not cover these features. If you are required to comply with HIPAA, we recommend that you disable Ask AI.