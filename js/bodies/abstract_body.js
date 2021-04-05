class AbstractBody {

    constructor(scale, motors_torque){
        this.SCALE = scale;
        this.MOTORS_TORQUE = motors_torque;
        this.body_parts = [];
        this.motors = [];
    }

    get_state_size(){
        return this.get_motors_state().length;
    }

    get_motors_state(){
        let state = [];
        for(let motor of this.motors){
            let motor_info = motor.GetUserData();
            if(motor_info.check_contact){
                let s = [
                    motor.GetJointAngle() + motor_info.angle_correction,
                    motor.GetJointSpeed() / motor_info.speed_control,
                    0.0
                ]
                if(motor_info.contact_body.GetUserData().has_contact){
                    s[2] = 1.0;
                }
                state = state.concat(s);
            }
            else{
                state = state.concat([
                    motor.GetJointAngle() + motor_info.angle_correction,
                    motor.GetJointSpeed() / motor_info.speed_control
                ])
            }
        }
        return state;
    }

    get_action_size(){
        return this.motors.length;
    }

    activate_motors(action){
        for(let i = 0; i < this.motors.length; i++){
            this.motors[i].SetMotorSpeed(this.motors[i].GetUserData().speed_control * Math.sign(action[i]));
            let clamp01 = Math.max(0, Math.min(Math.abs(action[i]), 1));
            this.motors[i].SetMaxMotorTorque(this.MOTORS_TORQUE * clamp01);
        }
    }

    draw(world, init_x, init_y, force_to_center){}

    get_elements_to_render(){
        return this.body_parts;
    }

    get_parts_position(){
        let positions = [];
        for(let body of this.body_parts){
            positions.push(body.GetPosition());
        }
        return positions;
    }

    destroy(world){
        for(let body of this.body_parts){
            world.Destroy(body);
        }
        this.body_parts = [];
        this.motors = [];
    }
}