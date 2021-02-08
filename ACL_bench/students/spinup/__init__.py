# Disable TF deprecation warnings.
# Syntax from tf1 is not expected to be compatible with tf2.
import tensorflow as tf
#tf.compat.v1.logging.set_verbosity(tf.compat.v1.logging.ERROR)
tf.logging.set_verbosity(tf.logging.ERROR)

# Algorithms
from ACL_bench.students.spinup.algos.tf1.sac_v02.sac import sac as sac_02_tf1
from ACL_bench.students.spinup.algos.tf1.sac_v011.sac import sac as sac_011_tf1

from ACL_bench.students.spinup.algos.pytorch.sac_v02.sac import sac as sac_02_pytorch

# Loggers
from ACL_bench.students.spinup.utils.logx import Logger, EpochLogger

# Version
#from ACL_bench.students_new.version import __version__