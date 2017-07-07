var NilsonView = Backbone.View.extend({
	template: _.template($("#nilson-block").html()),
	render:   function () {
		var self = this;
		this.$el.empty();

		var registrationView = new NilsonRegistrationView({
			model: new NilsonModel()
		});
		var leftColumn       = new LeftColumn({
			model: {
				models: []
			}
		});
		this.$el.append(this.template());
		this.$el.find("#registration").append(registrationView.render().$el);
		this.$el.find("#sidebar-left").append(leftColumn.render().$el);
		this.delegateEvents();
		return this;
	}
});

var NilsonRegistrationView = Backbone.View.extend({

	tagMessageError: "danger",

	tagMessageSuccess: "success",

	events: {
		"submit #registration-form": "onFormSubmit"
	},

	/**
	 * Template for the view
	 */
	template: _.template($("#nilson-registration-block").html()),

	/**
	 * Error tag for the view
	 */
	errorTag: "nilsonRegistrationError",


	/**
	 * Bind the method to the error event firing
	 */
	initialize:        function () {
		this.listenTo(events, this.errorTag, this.onErrorEvent);
	},
	/**
	 * Render view
	 * @returns {NilsonRegistrationView}
	 */
	render:            function () {
		var self = this;
		this.delegateEvents();
		this.$el.empty();
		var notification = new Alert({
			model: {
				type:    "info",
				message: t("You have already registered in the system")
			}
		});
		this.$el.append(this.template({
			isSignedUp: window.nilsonModel.isDeviceSignedUp,
			notificationHTML: notification.render().$el.html()
		}));
		return this;
	},
	/**
	 * Show alert error message
	 * @param message
	 */
	onErrorEvent:      function (message) {
		this.pushMessage(message, this.tagMessageError);
	},
	/**
	 * Handle form submit
	 * @param e
	 */
	onFormSubmit:      function (e) {
		var self = this;
		var clientID = $(e.target).find("#registration-client-id").val();
		var button   = $(e.target).find("#registration-submit");
		$(button).button("loading");
		this.model.registration(clientID).always(function (response) {
			$(button).button("reset");
			var type = response.success ? self.tagMessageSuccess : self.tagMessageError;
			self.render();
			self.pushMessage(response.message, type);
		});
		console.log("submit");
		return false;
	},

	/**
	 * Push message to view
	 * @param message
	 * @param type
	 */
	pushMessage:       function (message, type) {
		var alert = new Alert({
			model: {
				type:    type,
				message: message
			}
		});
		this.clearMessageBlock().append(alert.render().$el);
	},
	/**
	 * Clear error block
	 * @returns {*}
	 */
	clearMessageBlock: function () {
		return this.$el.find(".error-block").empty();
	},
});

var NilsonModel = Backbone.Model.extend({

	defaults:       {
		url: "http://95.67.14.79/api/ds"
	},
	errorDevice:    "Unreachable device",
	errorAPI:       "Unreachable API",
	messageSuccess: "The device was registered successfully",
	isDeviceSignedUp: false,
	registration:   function (clientID) {
		var deferred = $.Deferred();
		var self     = this;
		var response = {
			success: true,
			message: ""
		};

		var data = {
			"hash": btoa(clientID)
		};
		$.ajax({
			url:      '/cgi/nls_signup',
			type:     "post",
			dataType: "json",
			data:     JSON.stringify(data),
			success:  function (result) {
				if (result["ret"] == 0) {
					response.message = t(self.messageSuccess);
					return deferred.resolve(response);
				}
				else {
					response.success = false;
					response.message = t(self.errorAPI);
					window.nilsonModel.isDeviceSignedUp = false;
					return deferred.reject(response);
				}
			},
			error:    function () {
				response.success = false;
				response.message = t(self.errorDevice);
				return deferred.reject(response);
			}
		});
		return deferred.promise();
	},
	isDeviceAlreadySignedUp: function () {
		var deferred = $.Deferred();
		var self = this;
		$.ajax({
			url: '/cgi/nls_signup?check',
			type: 'post',
			dataType: 'json',
			success: function(response) {
				if (!_.isEmpty(response["psw"])) {
					self.isDeviceSignedUp = true;
				}
				return deferred.resolve();
			},
			error: function() {
				return deferred.reject();
			}
		});
		return deferred.promise();
	}

});