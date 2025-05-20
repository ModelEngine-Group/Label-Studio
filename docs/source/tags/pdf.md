---
title: PDF
type: tags
order: 302
meta_title: PDF Tag for loading PDF documents
meta_description: Label Studio PDF Tag for loading PDF documents for machine learning and data science projects.
---

The `Pdf` tag displays a PDF document for labeling. Use for performing document-level annotations, transcription, and summarization.

Use with the following data types: PDF.

{% insertmd includes/tags/pdf.md %}

### Supported Control tags
Document-level annotations are supported with Pdf tag, for example:

- Document classification with [Choices](/tags/choices.html)
- Document rating with [Rating](/tags/rating.html)
- Transcription and summarization with [TextArea](/tags/textarea.html)

### Example

Labeling configuration to label PDF documents:

```html
<View>
  <Pdf name="pdf" value="$pdf" />
  <Choices name="choices" toName="pdf">
    <Choice value="Legal" />
    <Choice value="Financial" />
    <Choice value="Technical" />
  </Choices>
</View>
```

**Example Input data:**

```json
{
  "pdf": "https://app.humansignal.com/static/samples/sample.pdf"
}
```

