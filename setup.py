from os.path import join, dirname, realpath
from setuptools import setup
import sys

assert sys.version_info.major == 3 and sys.version_info.minor >= 6, \
    "This repo is designed to work with Python 3.6 and greater." \
    + "Please install it before proceeding."

setup(
    name='ACL_bench',
    py_modules=['ACL_bench'],
    version="0.1",
    install_requires=[
        'cloudpickle==1.2.0',
        'gym[atari,box2d,classic_control]>=0.10.8',
        'ipython',
        'joblib',
        'matplotlib',
        'numpy',
        'pandas',
        'pytest',
        'psutil',
        'scipy',
        'sklearn',
        'imageio',
        'seaborn==0.8.1',
        'tensorflow<2',
        'dm-sonnet<2',
        'tensorflow-probability==0.7.0',
        'torch==1.4.0',
        'setuptools',
        'setuptools_scm',
        'pep517',
        'treelib',
        'gizeh',
        'tqdm',
        'emcee'
    ],
    description="Teacher algorithms for curriculum learning of Deep RL in continuously parameterized environments",
    author="Rémy Portelas",
)
