FROM pytorch/pytorch

RUN cd / \
&& git clone https://github.com/AUTOMATIC1111/stable-diffusion-webui \
&& cd stable-diffusion-webui \
&& python -m pip install --upgrade pip wheel \
&& sed -i '/fastapi/c\fastapi==0.90.1' requirements.txt \
&& sed -i '/pytorch_lightning/c\pytorch_lightning==1.6.5' requirements.txt \
&& echo >> requirements.txt \
&& echo timm >> requirements.txt

WORKDIR /stable-diffusion-webui

ENV REQS_FILE='requirements.txt'

CMD ["python", "launch.py", "--listen", "--api", "--data", "/data/stable-diffusion-webui/models"]
