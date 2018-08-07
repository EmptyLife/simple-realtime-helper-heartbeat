
const assert = require("assert")
const EventEmitter = require("events")
const SetInterval = require("./SetInterval")


/**
	input events:
		recv:pong
	output events:
		send:ping
		ping
*/

class Heartbeat extends EventEmitter {
	constructor(events, options) {
		super();
		
		this.options = {
			msg_timeout: 5e3,
			ping_timeout: 5e3,
			ping_timeinterval: 1e3,
			
			...options
		};
		
		
		this.STATE_EXPECTED_OPEN = 1;
		this.STATE_EXPECTED_MESSAGE = 2;
		this.STATE_EXPECTED_PONG = 3;
		
		this.lastTime = null;
		this.pingQueue = [];
		
		this.state = this.STATE_EXPECTED_OPEN;
		
		this.iidCheckTime = new SetInterval(1e3, this._checkTime.bind(this));
		this.iidPing = new SetInterval(this.options.ping_timeinterval, this._sendPing.bind(this));
		
		events.on("open", () => {
			this._updateTime();
			this.state = this.STATE_EXPECTED_MESSAGE;
	
			this.pingQueue = [];
			this.iidCheckTime.open();
			this.iidPing.open();
		});
		events.on("close", () => {
			this.iidCheckTime.close();
			this.iidPing.close();
		});
		events.on("message", () => {
			this._updateTime();
			this.state = this.STATE_EXPECTED_MESSAGE;
		});
	
		this.on("recv:pong", this.pong.bind(this));
	}
	_updateTime() {
		this.lastTime = Date.now();
	}
	
	_checkTime() {
		const time = Date.now();
		
		if ( this.state === this.STATE_EXPECTED_MESSAGE ) {
			if ( this.lastTime + this.options.msg_timeout <= time ) {
				this._updateTime();
				this.state = this.STATE_EXPECTED_PONG;
				this._sendPing();
			}
		}
		
		if ( this.state === this.STATE_EXPECTED_PONG ) {
			if ( this.lastTime + this.options.ping_timeout <= time ) {
				this._updateTime();
				this.state = this.STATE_EXPECTED_OPEN;
				this.emit("reconnect");
			}
		}
		
	}

	_sendPing() {
		this.pingQueue.push(Date.now());
		this.emit("send:ping");
	}
	pong(origin) {
		const time = this.pingQueue.shift();
		if ( time ) {
			const ping = Date.now() - time;
			this.emit("ping", {
				time, ping, origin,
			});
		}
	}
}

module.exports = Heartbeat;
