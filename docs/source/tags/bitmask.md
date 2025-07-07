---
title: Bitmask
type: tags
order: 401
meta_title: Bitmask Tag for Image Segmentation Labeling
meta_description: Customize Label Studio with bitmask pixel-wise tags for image segmentation labeling for machine learning and data science projects.
---

The `Bitmask` tag for pixel-wise image segmentation tasks is used in the area where you want to apply a mask or use a brush to draw a region on the image.

`Bitmask` operates on pixel level and outputs a Base64 encoded PNG data URL image with black pixels on transparent background.

Export data example: `data-url:image/png;[base64-encoded-string]`

**Note:** You need to set `smoothing="false"` on the Image tag to be able to work with individual pixels;

<video class="Video astro-OQEP7KKB" loop="" playsinline="" autoplay="" muted="">
  <source src="https://cdn.sanity.io/files/mzff2hy8/production/4812f66851a7fd4836e729bc7ccb7e510823af5d.mp4" type="video/mp4" class="astro-OQEP7KKB">
</video>

Use with the following data types: image.

{% insertmd includes/tags/bitmask.md %}

### Example

Basic image segmentation labeling configuration:

```xml
<View>
  <Bitmask name="bitmask" toName="image" />
  <Labels name="labels" toName="image">
    <Label value="Person" />
    <Label value="Animal" />
  </Labels>
  <Image name="image" value="$image" />
</View>
```
