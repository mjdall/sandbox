Skip to content

## Navigation Menu

Toggle navigation

Sign in

  * Product 

    * Actions

Automate any workflow

    * Packages

Host and manage packages

    * Security

Find and fix vulnerabilities

    * Codespaces

Instant dev environments

    * GitHub Copilot

Write better code with AI

    * Code review

Manage code changes

    * Issues

Plan and track work

    * Discussions

Collaborate outside of code

Explore

    * All features 
    * Documentation 
    * GitHub Skills 
    * Blog 

  * Solutions 

By size

    * Enterprise 
    * Teams 
    * Startups 

By industry

    * Healthcare 
    * Financial services 
    * Manufacturing 

By use case

    * CI/CD & Automation 
    * DevOps 
    * DevSecOps 

  * Resources 

Topics

    * AI 
    * DevOps 
    * Security 
    * Software Development 
    * View all 

Explore

    * Learning Pathways 
    * White papers, Ebooks, Webinars 
    * Customer Stories 
    * Partners 

  * Open Source 

    * GitHub Sponsors

Fund open source developers

    * The ReadME Project

GitHub community articles

Repositories

    * Topics 
    * Trending 
    * Collections 

  * Enterprise 

    * Enterprise platform

AI-powered developer platform

Available add-ons

    * Advanced Security

Enterprise-grade security features

    * GitHub Copilot

Enterprise-grade AI features

    * Premium Support

Enterprise-grade 24/7 support

  * Pricing

Search or jump to...

# Search code, repositories, users, issues, pull requests...

Search

Clear

Search syntax tips

#  Provide feedback

We read every piece of feedback, and take your input very seriously.

Include my email address so I can be contacted

Cancel  Submit feedback

#  Saved searches

## Use saved searches to filter your results more quickly

Name

Query

To see all available qualifiers, see our documentation.

Cancel  Create saved search

Sign in

Sign up  Reseting focus

You signed in with another tab or window. Reload to refresh your session. You
signed out in another tab or window. Reload to refresh your session. You
switched accounts on another tab or window. Reload to refresh your session.
Dismiss alert

{{ message }}

catcathh  / UltraPixel Public

  * Notifications  You must be signed in to change notification settings
  * Fork 16 
  * Star 489 

Implementation of UltraPixel: Advancing Ultra-High-Resolution Image Synthesis
to New Peaks

### License

AGPL-3.0 license

489 stars  16 forks  Branches  Tags  Activity

Star

Notifications  You must be signed in to change notification settings

  * Code 
  * Issues 14 
  * Pull requests 0 
  * Actions 
  * Projects 0 
  * Security 
  * Insights 

Additional navigation options

  * Code 
  * Issues 
  * Pull requests 
  * Actions 
  * Projects 
  * Security 
  * Insights 

# catcathh/UltraPixel

This commit does not belong to any branch on this repository, and may belong
to a fork outside of the repository.

main

**1** Branch

**0** Tags

Go to file

Code

## Folders and files

Name| Name| Last commit message| Last commit date  
---|---|---|---  
  
## Latest commit

## History

17 Commits  
configs| configs| Initial commit| Jul 15, 2024  
core| core| add .gitignore file| Jul 15, 2024  
figures| figures| Add files via upload| Sep 2, 2024  
gdf| gdf| add .gitignore file| Jul 15, 2024  
inference| inference| Update test_t2i.py| Jul 15, 2024  
models| models| Initial commit| Jul 15, 2024  
modules| modules| add .gitignore file| Jul 15, 2024  
train| train| add .gitignore file| Jul 15, 2024  
.gitignore| .gitignore| add .gitignore file| Jul 15, 2024  
LICENSE| LICENSE| Create LICENSE| Jul 19, 2024  
README.md| README.md| Update README.md| Sep 19, 2024  
app.py| app.py| Create app.py| Sep 19, 2024  
prompt_list.txt| prompt_list.txt| Initial commit| Jul 15, 2024  
requirements.txt| requirements.txt| Update requirements.txt| Sep 19, 2024  
View all files  
  
## Repository files navigation

  * README
  * AGPL-3.0 license

# UltraPixel

This is the implementation for UltraPixel: Advancing Ultra-High-Resolution
Image Synthesis to New Peaks.

UltraPixel is designed to create exceptionally high-quality, detail-rich
images at various resolutions, pushing the boundaries of ultra-high-resolution
image synthesis. For more details and to see more stunning images, please
visit the Project Page. The arXiv version of the paper contains compressed
images, while the full paper features uncompressed, high-quality images.

## 🔥 Updates:

  * `2024/09/19`: 🤗 We released the HuggingFace Space, thanks to the HF team and Gradio! Gradio interface for text-to-image inference is also provided, and please see Inference section!
  * `2024/09/19`: We have updated the versions of PyTorch and Torchvision in our environment. On an RTX 4090 GPU, generating a 2560×5120 image (without stage_a_tiled) now takes approximately 60 seconds, compared to about three minutes in the previous setup.

![\\"teaser\\"](\\"/catcathh/UltraPixel/raw/main/figures/teaser.jpg\\")

## Getting Started

1\. Install dependency by running:

```

    
    
    pip install -r requirements.txt
    
```

2\. Download pre-trained models from StableCascade model downloading
instructions. Small-big models (the small model for stage b and the big model
for stage with bfloat16 format are used.) The big-big setting is also
supported, while small-big favors more efficiency.

3\. Download newly added parameters of UltraPixel from here.

Note: All model downloading urls are provided here. They should be put in the
directory models.

## Inference

### Text-guided Image Generation

We provide Gradio interface for inference. Run by :

```

    
    
    CUDA_VISIBLE_DEVICES=0 python app.py
    
```

Or generate an image by running:

```

    
    
    CUDA_VISIBLE_DEVICES=0 python inference/test_t2i.py
    
```

Tips: To generate aesthetic images, use detailed prompts with specific
descriptions. It\'s recommended to include elements such as the subject,
background, colors, lighting, and mood, and enhance your prompts with high-
quality modifiers like \"high quality\", \"rich detail\", \"8k\", \"photo-
realistic\", \"cinematic\", and \"perfection\". For example, use \"A
breathtaking sunset over a serene mountain range, with vibrant orange and
purple hues in the sky, high quality, rich detail, 8k, photo-realistic,
cinematic lighting, perfection\". Be concise but detailed, specific and clear,
and experiment with different word combinations for the best results.

Several example prompts are provided here.

It is recommended to add \"--stage_a_tiled\" for decoding in stage a to save
memory.

The table below show memory requirements and running times on different GPUs.
For the A100 with 80GB memory, tiled decoding is not necessary.

On 80G A100:

Resolution | Stage C | Stage B | Stage A  
---|---|---|---  
2048*2048 | 15.9G / 12s | 14.5G / 4s | w/o tiled: 11.2G / 1s  
4096*4096 | 18.7G / 52s | 19.7G / 26s | w/o tiled: 45.3G / 2s, tiled: 9.3G / 128s  
  
On 32G V100 (only works using float32 on Stages C and B):

Resolution | Stage C | Stage B | Stage A  
---|---|---|---  
2048*2048 | 16.7G / 83s | 11.7G / 22s | w/o tiled: 10.1G / 2s  
4096*4096 | 18.0G / 287s | 22.7G / 172s | w/o tiled: OOM, tiled: 9.0G / 305s  
  
On 24G RTX4090:

Resolution | Stage C | Stage B | Stage A  
---|---|---|---  
2048*2048 | 15.5G / 83s | 13.2G / 22s | w/o tiled: 11.3G / 1s  
4096*4096 | 19.9G / 153s | 23.4G / 44s | w/o tiled: OOM, tiled: 11.3G / 114s  
  
### Personalized Image Generation

The repo provides a personalized model of a cat. Download the personalized
model here and run the following command to generate personalized results.
Note that in the text command you need to use identifier \"cat [roubaobao]\"
to indicate the cat.

```

    
    
    CUDA_VISIBLE_DEVICES=0 python inference/test_personalized.py
    
```

### Controlnet Image Generation

Download Canny ControlNet provided by StableCascade and run the command:

```

    
    
    CUDA_VISIBLE_DEVICES=0 python inference/test_controlnet.py
    
```

Note that ControlNet is used without further fine-tuning, so the supported
highest resolution is 4K, e.g., 3840 * 2160, 2048 * 2048.

## T2I Training

Put all your images and captions into a folder. Here\'s an example training
dataset here for reference. Start training by running:

```

    
    
    CUDA_VISIBLE_DEVICES=0,1,2,3,4,5,6,7 python train/train_t2i.py configs/training/t2i.yaml
    
```

## Personalized Training

Put all your images into a folder. Here\'s an expample training dataset here.
The training prompt can be described as: a photo of a cat [roubaobao].

Start training by running:

```

    
    
    CUDA_VISIBLE_DEVICES=0,1 python train/train_personalized.py \
    configs/training/lora_personalization.yaml
    
```

## Citation

```

    
    
    @article{ren2024ultrapixel,
     title={UltraPixel: Advancing Ultra-High-Resolution Image Synthesis to New Peaks},
     author={Ren, Jingjing and Li, Wenbo and Chen, Haoyu and Pei, Renjing and Shao, Bin and Guo, Yong and Peng, Long and Song, Fenglong and Zhu, Lei},
     journal={arXiv preprint arXiv:2407.02158},
     year={2024}
    }
```

## Contact Information

To reach out to the paper’s authors, please refer to the contact information
provided on the project page.

## Acknowledgements

This project is build upon StableCascade and Trans-inr. Thanks for their code
sharing ：）

## About

Implementation of UltraPixel: Advancing Ultra-High-Resolution Image Synthesis
to New Peaks

### Resources

Readme

### License

AGPL-3.0 license

Activity

### Stars

489 stars

### Watchers

7 watching

### Forks

16 forks

Report repository

##  Releases

No releases published

##  Packages 0

No packages published

## Languages

  * Python 100.0% 

## Footer

© 2024 GitHub, Inc.

### Footer navigation

  * Terms
  * Privacy
  * Security
  * Status
  * Docs
  * Contact
  * Manage cookies 
  * Do not share my personal information 

You can’t perform that action at this time.

