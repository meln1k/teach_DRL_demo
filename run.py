import argparse
import os

from ACL_bench.run_utils.environment_args_handler import EnvironmentArgsHandler
from ACL_bench.run_utils.replay_buffer_args_handler import ReplayBufferArgsHandler
from ACL_bench.run_utils.teacher_args_handler import TeacherArgsHandler

from ACL_bench.run_utils.student_args_handler import StudentArgsHandler

if __name__ == '__main__':
    # Argument definition
    print('Preparing the parsing...')
    parser = argparse.ArgumentParser()

    parser.add_argument('--exp_name', type=str, default='test')
    parser.add_argument('--seed', '-s', type=int, default=0)

    StudentArgsHandler.set_parser_arguments(parser)
    EnvironmentArgsHandler.set_parser_arguments(parser)
    TeacherArgsHandler.set_parser_arguments(parser)
    ReplayBufferArgsHandler.set_parser_arguments(parser)

    # Argument parsing
    args = parser.parse_args()
    # Bind this run to specific GPU if there is one
    if args.gpu_id is not None:
        os.environ["CUDA_VISIBLE_DEVICES"] = str(args.gpu_id)

    print('Setting up the environment...')
    env_f, param_env_bounds, initial_dist, target_dist = EnvironmentArgsHandler.get_object_from_arguments(args)

    print('Setting up the teacher algorithm...')
    Teacher = TeacherArgsHandler.get_object_from_arguments(args, param_env_bounds, initial_dist, target_dist)

    # print('Setting up the replay buffer...')
    # env = env_f()
    # obs_dim = env.observation_space.shape[0]
    # act_dim = env.action_space.shape[0]
    # env.close()
    #
    # replay_buffer = ReplayBufferArgsHandler.get_object_from_arguments(args, Teacher, obs_dim, act_dim)

    print('Setting up the student algorithm...')
    # Launch Student training
    student_function = StudentArgsHandler.get_object_from_arguments(args, env_f, Teacher)
    print('Training...')
    student_function()