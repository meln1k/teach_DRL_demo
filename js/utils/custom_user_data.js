let CustomUserDataObjectTypes = {
    BODY_OBJECT: 0,
    WATER: 1,
    TERRAIN: 2,
    GRIP_TERRAIN: 3,
    MOTOR: 4,
    BODY_SENSOR: 5,
    SENSOR_GRIP_TERRAIN:6,
};

class CustomUserData{
    constructor(name, object_type){
        this.name = name;
        this.object_type = object_type;
    }
}

class CustomMotorUserData extends CustomUserData{
    constructor(name, speed_control, check_contact, angle_correction=0.0, contact_body=null){
        super(name, CustomUserDataObjectTypes.MOTOR);
        this.speed_control = speed_control;
        this.check_contact = check_contact;
        this.angle_correction = angle_correction;
        this.contact_body = contact_body;
    }
}

class CustomBodyUserData extends CustomUserData{
    constructor(check_contact, is_contact_critical=false,
                 name="body_part", object_type=CustomUserDataObjectTypes.BODY_OBJECT){
        super(name, object_type);
        this.check_contact = check_contact;
        this.is_contact_critical = is_contact_critical;
        this.has_contact = false;
    }
}

class CustomBodySensorUserData extends CustomBodyUserData{
    constructor(check_contact, is_contact_critical=false, name="body_part"){
        super(check_contact, is_contact_critical, name, CustomUserDataObjectTypes.BODY_SENSOR);
        this.has_joint = false;
        this.ready_to_attach = false;
    }
}
