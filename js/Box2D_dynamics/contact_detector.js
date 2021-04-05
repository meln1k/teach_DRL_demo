function ContactDetector (env){
    b2.ContactListener.call(this);
    this.water_contact_detector = new WaterContactDetector();
    this.climbing_contact_detector = new ClimbingContactDetector();
    this.env = env;
}

ContactDetector.prototype = Object.create(b2.ContactListener.prototype);
ContactDetector.prototype.constructor = ContactDetector;
ContactDetector.prototype.BeginContact = function (contact){
    let bodies = [contact.GetFixtureA().GetBody(), contact.GetFixtureB().GetBody()];
    const anyWater = (body) => body.GetUserData().object_type == CustomUserDataObjectTypes.WATER;
    const anySensor = (body) => body.GetUserData().object_type == CustomUserDataObjectTypes.BODY_SENSOR;
    if(bodies.some(anyWater)){
        this.water_contact_detector.BeginContact(contact);
    }
    else if(bodies.some(anySensor)){
        this.climbing_contact_detector.BeginContact(contact);
    }
    else{
        if(contact.GetFixtureA().IsSensor() || contact.GetFixtureB().IsSensor()){
            return;
        }

        for(let i = 0; i < bodies.length; i++){
            let body = bodies[i];
            if(body.GetUserData().object_type == CustomUserDataObjectTypes.BODY_OBJECT && body.GetUserData().check_contact){
                body.GetUserData().has_contact = true;
                let other_body = bodies[(i + 1) % 2];
                // Authorize climbing bodies to touch climbing parts
                if(body.GetUserData().is_contact_critical && !(other_body.GetUserData().object_type == CustomUserDataObjectTypes.GRIP_TERRAIN
                                                        && this.env.agent_body.body_type == BodyTypesEnum.CLIMBER)){
                    this.env.critical_contact = true;
                }
            }
        }
    }
};

ContactDetector.prototype.EndContact = function (contact){
    let bodies = [contact.GetFixtureA().GetBody(), contact.GetFixtureB().GetBody()];
    const anyWater = (body) => body.GetUserData().object_type == CustomUserDataObjectTypes.WATER;
    const anySensor = (body) => body.GetUserData().object_type == CustomUserDataObjectTypes.BODY_SENSOR;
    if(bodies.some(anyWater)){
        this.water_contact_detector.EndContact(contact);
    }
    else if(bodies.some(anySensor)){
        this.climbing_contact_detector.EndContact(contact);
    }
    else {
        for(let body of bodies){
            if(body.GetUserData().object_type == CustomUserDataObjectTypes.BODY_OBJECT && body.GetUserData().check_contact){
                body.GetUserData().has_contact = false;
            }
        }
    }
};

ContactDetector.prototype.Reset = function (){
    this.water_contact_detector.Reset();
    this.climbing_contact_detector.Reset();
}


function LidarCallback(agent_mask_filter){
    b2.RayCastCallback.call(this);
    this.agent_mask_filter = agent_mask_filter;
    this.fixture = null;
    this.is_water_detected = false;
    this.is_creeper_detected = false;
};

LidarCallback.prototype = Object.create(b2.RayCastCallback.prototype);
LidarCallback.prototype.constructor = LidarCallback;
LidarCallback.prototype.ReportFixture = function (fixture, point, normal, fraction){
    if((fixture.GetFilterData().categoryBits & this.agent_mask_filter) == 0){
        return -1;
    }

    this.p2 = point;
    this.fraction = fraction;
    this.is_water_detected = fixture.GetBody().GetUserData().object_type == CustomUserDataObjectTypes.WATER;
    this.is_creeper_detected = fixture.GetBody().GetUserData().object_type == CustomUserDataObjectTypes.SENSOR_GRIP_TERRAIN;
    return fraction;
}
