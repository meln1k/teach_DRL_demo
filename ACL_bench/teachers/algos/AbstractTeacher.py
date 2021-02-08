import numpy as np
class AbstractTeacher(object):
    def __init__(self, mins, maxs, env_reward_lb, env_reward_ub, seed=None, **args):
        self.seed = seed
        if not seed:
            self.seed = np.random.randint(42, 424242)
        self.random_state = np.random.RandomState(self.seed)

        # Task space boundaries
        self.mins = np.array(mins)
        self.maxs = np.array(maxs)
        self.value_estimator = lambda state: None
        self.env_reward_lb = env_reward_lb
        self.env_reward_ub = env_reward_ub
        self.bk = {}

    def create_dist_from_bounds(self, mins, maxs, subspace):
        if subspace:
            mean = np.array([self.random_state.uniform(min, max) for min, max in zip(mins, maxs)])
            variance = [(abs(max - min) * 0.1) ** 2 for min, max in zip(mins, maxs)] # std = 10 % of each dimension
        else:
            mean = np.array([np.mean([min, max]) for min, max in zip(mins, maxs)])
            variance = [(abs(max - min) / 4)**2 for min, max in zip(mins, maxs)] # std = 0.25 * range => ~95.5% of samples are between the bounds
        variance = [1e-6 if v == 0 else v for v in variance]  # avoid errors with null variance
        covariance = np.diag(variance)

        return mean, covariance

    def get_or_create_dist(self, dist_dict, mins, maxs, subspace=False):
        if dist_dict is not None:
            dist_mean = dist_dict["mean"]
            dist_variance = dist_dict["variance"]
        else:
            dist_mean, dist_variance = self.create_dist_from_bounds(mins, maxs, subspace)
        return dist_mean, dist_variance

    def rescale_task(self, task, original_space=(0, 1)):
        return np.array([np.interp(task[i], original_space, (self.mins[i], self.maxs[i]))
                         for i in range(len(self.mins))])

    def inverse_rescale_task(self, task, original_space=(0, 1)):
        return np.array([np.interp(task[i], (self.mins[i], self.maxs[i]), original_space)
                         for i in range(len(self.mins))])

    def record_initial_state(self, task, state):
        pass

    def episodic_update(self, task, reward, is_success):
        pass

    def step_update(self, state, action, reward, next_state, done):
        pass

    def sample_task(self):
        pass

    def non_exploratory_task_sampling(self):
        return {"task": self.sample_task(), "infos": None}

    def is_non_exploratory_task_sampling_available(self):
        return True

    def dump(self, dump_dict):
        dump_dict.update(self.bk)
        return dump_dict