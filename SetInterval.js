
class SetInterval {
	constructor(timeinterval, ...callbacks) {		
		this.timeinterval = timeinterval;
		this.iid = null;
		
		this.fn = () => {
			callbacks.forEach(callback => {
				if ( typeof callback === "function" ) {
					callback();
				}
			});
		};
	}
	open() {
		if ( this.iid === null ) {
			this.iid = setInterval(this.fn, this.timeinterval);
		}
	}
	close() {
		if ( this.iid !== null ) {
			clearInterval(this.iid);
		}
		this.iid = null;
	}
}

module.exports = SetInterval;
