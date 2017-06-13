/**
 * Created by Andrew on 11.02.2015.
 */
//<editor-fold desc="----------------------Modem  Page--------------------------------">

/*var ModemPage = PageScreen.extend({
 initialize: function(args) {
 this.leftCol = new LeftColumn({ model:{modelIdx:args.no,
 models:[
 {lnk:'#modem/state',name:'State'},
 {lnk:"#modem/settings",name:'Settings'},
 {lnk:"#modem/docs",name:'Documents'}
 ]}}
 );
 this.page = args.page;
 }
 });*/

var ModemState = PageView.extend({
	template:   _.template($('#modem-state').html()),
	events:     {
		'click #do_conn':    'conn',
		'click #do_log':     'log',
		'click #sam_switch': 'sam',
		'click #sam_wr':     'samWrite',
		'click #pers_do':    'pers'
	},
	initialize: function () {
		this.model.on('change', this.render, this);
		//this.model.fetch();
	},
	/*render: function() {
	 this.$el.html(this.template(this.model.toJSON()));
	 //this.$el.html(this.template(_.defaults(this.model,{})));
	 return this;
	 },*/
	log:        function () {
		htmlLog.add('#logPlace');
	},
	sam:        function () {
		this.log();
		var c = this.model.get('card_no');
		$.get('cgi/sam_info?p=' + ((c == '-') ? 1 : 0));
	},
	conn:       function () {
		this.log();
		$.get('/cgi/do_conn');
	},
	samWrite:   function () {
		this.log();
		$.get('/cgi/sam_info?p=2');
	},
	pers:       function () {
		this.log();
		$.get('/cgi/pers');
	}
});

var ModemDocs = PageView.extend({
	template:   _.template($('#modem-docs').html()),
	di_doc:     _.template($('#di-doc').html()),
	initialize: function () {
		ecrStatus.on('change:CurrDI', this.render, this);
	},
	render:     function () {
		this.delegateEvents();
		this.$el.html(this.template(ecrStatus.toJSON()));
		this.$('#docs, #dif').submit(blockDef);
		return this;
	},
	events:     {
		'click #check':  'check',
		'click #di_chk': 'di_chk',
		'click #di_z':   'di_z'
	},
	query_chk:  function (dis) {
		if (!_.isArray(dis)) dis = [dis];
		var xml   = this.$('#di_xml');
		xml.addClass("alert alert-info").html("");
		var $this = this;
		_.each(dis, function (di) {
			xml.append(this.di_doc({di: di}));
			var msg = this.$('#di' + di, xml);
			$.get("cgi/verify?di=" + di).done(function (obj) {
				console.log('verify', obj.msg);
				msg.removeClass('panel-default').addClass((obj.msg == 0) ? "panel-success" : "panel-error");
				$('.panel-footer', msg).html(t($this.msg(obj.msg)));
				if (obj.msg > 1) {
					$('.panel-body', msg).html('');
				} else {
					$.ajax("cgi/ditxt?p=" + di, {dataType: "text"}).done(function (t) {
						var kind   = "Невідомий тип чеку";
						var doc    = t.slice(0, t.search('<MAC'));
						var xmlDoc = $.parseXML(doc);
						if (xmlDoc) {
							var c = $(xmlDoc).find('C');
							if (c.length) {
								switch (c.attr('T')) {
									case "0":
										kind = 'Чек продажу';
										break;
									case "1":
										kind = 'Чек повернення';
										break;
									case "2":
										kind = 'Службовий чек';
										break;
								}
							} else {
								c = $(xmlDoc).find('Z');
								if (c.length) kind = 'Звіт';
							}
						}
						$('h3', msg).html(kind);
						$('.panel-body', msg).text(t);
					}).fail(function () {
						$('.panel-body', msg).html(failMessage(arguments));
					});
				}
			}).fail(function () {
				//console.log('fail1',arguments);
				msg.removeClass('panel-default').addClass("panel-error");
				$('.panel-footer', msg).html(failMessage(arguments));
				$('.panel-body', msg).html('');
			});
		}, this);
	},
	check:      function (e) {
		e.preventDefault();
		var di = this.$("#doc_di").val();
		this.query_chk(di);
		return false;
	},
	/*check: function(e) {
	 e.preventDefault();
	 var xml = this.$('#di_xml');
	 var di = this.$("#doc_di").val();
	 var msg = this.$('#msg');
	 var $this = this;
	 xml.addClass("alert alert-info").text(t('Loading...'));
	 msg.addClass("alert alert-info").text(t('Loading...'));
	 $.ajax("cgi/ditxt?p="+di,{dataType:"text"}).done(function(t){
	 xml.text(t);
	 }).fail(function(){
	 //console.log('fail',arguments);
	 xml.html(failMessage(arguments));
	 }).always(function() {
	 $.get("cgi/verify?di="+di).done(function(obj) {
	 console.log('verify',obj.msg);
	 msg.addClass((obj.msg==0)?"alert alert-success":"alert alert-error").html(t($this.msg(obj.msg)));
	 }).fail(function(){
	 //console.log('fail1',arguments);
	 msg.addClass("alert alert-error").html(failMessage(arguments));
	 });
	 });
	 return false;
	 },*/
	msg:        function (v) {
		switch (v) {
			case 0:
				return "Document valid";//"Документ вірний";
			case 1:
				return "Document not valid";//"Документ не вірний";
			case 2:
				return "Document not found";//"Документ не знайдено";
			case 3:
				return "Receipt not found";//"Чек не знайдено";
			case 4:
				return "Report not found";//"Звіт не знайдено";
		}
	},
	di_chk:     function () {
		this.di(this.$('#doc_z').val(), this.$('#doc_chk').val());
	},
	di_z:       function () {
		this.di(this.$('#doc_z').val());
	},
	di:         function (z, c) {
		var $this = this;
		//var msg = this.$('#msg');
		//msg.addClass("alert alert-info").html(t('Retreiving DI...'));
		$.get('/cgi/di_chk?' + (c ? ('c=' + c + '&') : '') + 'z=' + z).done(function (obj) {
			if (obj.msg) $this.$('#msg').addClass((obj.msg == 0) ? "alert alert-success" : "alert alert-error").html(t($this.msg(obj.msg)));
			if (obj.doc_di) $this.query_chk(obj.doc_di);//$this.$('#doc_di').val(obj.doc_di);
		}).fail(function () {
			//console.log('fail2',arguments);
			msg.addClass("alert alert-error").html(failMessage(arguments));
		});
	}
});


//</editor-fold>

//<editor-fold desc="----------------------Fiscal Page--------------------------------">

var GetDateTime = Backbone.View.extend({
	template:   _.template($('#date-time').html()),
	render:     function () {
		this.$el.html(this.template());
		var $this = this;
		$this.$('#date-group').hide();
		this.$("input[type=checkbox]").on("click", function (e) {
			if ($this.$("input:checked").length) {
				$this.$('#date-group').hide();
			} else {
				$this.$('#date-group').show();
			}
		});
		return this;
	},
	getDate:    function () {
		if (this.$("input:checked").length) return new Date();
		var date = this.$('#d').val();
		if (!_.isEmpty(date)) {
			return new Date(getDatetime(date));
		}
		else {
			return new Date();
		}
		if (is_type['datetime-local'])
		//return this.$('#d')[0].valueAsDate; Chrome do not set valueAsDate for this type of input.
			var dt = new Date();
		return new Date(this.$('#d')[0].valueAsNumber + dt.getTimezoneOffset() * 60000);
		var d = getDate(this.$('#d')[0]);
		var t = getTime(this.$('#t')[0]);
		if (d && t) {
			d.setDate(d.getDate() + t.getDate());
			return d;
		}
		return false;
	},
	getISODate: function () {
		var t = this.getDate();
		return t.getFullYear() +
			'-' + pad(t.getMonth() + 1) +
			'-' + pad(t.getDate()) +
			'T' + pad(t.getHours()) +
			':' + pad(t.getMinutes()) +
			':' + pad(t.getSeconds());
	}
});

/*var FiscalPage = PageScreen.extend({
 initialize: function(args) {
 this.leftCol = new LeftColumn({ model:{modelIdx:args.no,
 models:[
 {lnk:'#fm/fisc',name:'Fiscalization'},
 {lnk:'#fm/time',name:'Time'},
 {lnk:'#fm/reset',name:'Reset'}
 ]}}
 );
 this.page = args.page;
 }
 });*/

var ModemSettings = PageView.extend({
	remove: function () {
		this.settings.remove();
		PageView.prototype.remove.call(this);
	},
	render: function () {
		this.settings = new TableContainer({
			model:   schema.get('NSMEP'),
			tblMode: false,
			show:    true
		});
		this.delegateEvents();
		this.$el.html('');
		this.$el.append(this.settings.render().$el);
		return this;
	}
});

var FiscDo = PageView.extend({
	events:    {
		'click #hd':  'saveHdr',
		'click #tx':  'saveTax',
		'click #fsc': 'fiscalize'
	},
	remove:    function () {
		this.header.remove();
		this.taxes.remove();
		this.fsk.remove();
		PageView.prototype.remove.call(this);
	},
	render:    function () {
		this.header       = new TableContainer({
			model:   schema.get('Hdr'),
			tblMode: true,
			show:    true
		});
		this.taxes        = new TableContainer({
			model:   schema.get('Tax'),
			tblMode: true,
			show:    true
		});
		this.fsk          = new TableContainer({
			model:   schema.get('Fsk'),
			tblMode: false,
			show:    true
		});
		this.delegateEvents();
		this.$el.html('');
		this.$el.append(this.header.render().$el);
		this.$el.append(this.taxes.render().$el);
		this.$el.append(this.fsk.render().$el);
		var tmpl          = "<button type='button' id='%s' class='btn btn-%s' data-loading-text='%s'>%s</button>\n";
		/**
		 * The buttons on the bottom of the page
		 * @type {*[]}
		 */
		var buttonsBottom = [['fsc', 'primary', t('Wait...'), t('Fiscalize')]];
		/**
		 * If the device is fiscalized then remove "Fiscalize" button
		 * Else remove two other buttons
		 */
		if (fiscalCell.get("fiscalize")) {
			buttonsBottom = [['hd', 'default', t('Wait...'), t('Reregistration')],
				['tx', 'default', t('Wait...'), t('Change Tax Rates')]];
		}
		this.$el.append(_.reduce(buttonsBottom, function (memo, el) {
				el[2] = t(el[2]);
				return memo + vsprintf(tmpl, el);
			}, ""
		));
		return this;
	},
	checkTime: function (proc, e) {
		var ecrDate  = ecrStatus.getTime();
		var currDate = new Date();
		ecrDate.setHours(0, 0, 0, 0);
		currDate.setHours(0, 0, 0, 0);
		proc(e);
	},
	saveHdr:   function (e) {
		e.preventDefault();
		var self         = this;
		var confirmModal = new ConfirmModal();
		confirmModal.set({
			header: t('Warning'),
			body:   t('Are you you want to perform this operation?')
		});
		confirmModal.setCallback(function () {
			self.checkTime(self.doHdr, e);
		});
		confirmModal.show();
		return false;
	},
	saveTax:   function (e) {
		e.preventDefault();
		var self         = this;
		var confirmModal = new ConfirmModal();
		confirmModal.set({
			header: t('Warning'),
			body:   t('Are you you want to perform this operation?')
		});
		confirmModal.setCallback(function () {
			self.checkTime(self.doTax, e);
		});
		confirmModal.show();
		return false;
	},
	fiscalize: function (e) {
		e.preventDefault();
		var self         = this;
		var confirmModal = new ConfirmModal();
		confirmModal.set({
			header: t('Warning'),
			body:   t('Are you you want to perform this operation?')
		});
		confirmModal.setCallback(function () {
			self.checkTime(self.doFisc, e);
		});
		confirmModal.show();
		return false;
	},
	doHdr:     function (e) {
		callProc({addr: '/cgi/proc/puthdrfm', btn: e.target/*'#hd'*/});
		//console.log('Save Hdr');
	},
	doTax:     function (e) {
		callProc({addr: '/cgi/proc/puttaxfm', btn: e.target/*'#tx'*/});
		//console.log('Save Tax');
	},
	doFisc:    function (e) {
		callProc({addr: '/cgi/proc/fiscalization', btn: e.target/*'#fsc'*/});
		//console.log('Fiscalize');
	}
});

/**
 * Alert for the pushing of messages
 * Uses bootstrap alerts
 */
var Alert = Backbone.View.extend({
	template: _.template($("#alert-block").html()),
	render:   function () {
		this.$el.html(this.template({
			type:    this.model.type,
			message: this.model.message
		}));
		return this;
	}
});

var TimeForm = PageView.extend({
	tagName:   'div',
	className: 'col-md-10',
	render:    function () {
		if (this.timeView) {
			this.timeView.remove();
			delete this.timeView;
		}
		var eltxt     = this.template();
		this.delegateEvents();
		this.$el.html(eltxt);
		this.timeView = new GetDateTime();
		this.$('form').prepend(this.timeView.render().$el);
		return this;
	},
	remove:    function () {
		Backbone.View.prototype.remove.apply(this, arguments);
		if (this.timeView) {
			this.timeView.remove();
			delete this.timeView;
		}
	}
});

var FiscTime = TimeForm.extend({
	template: _.template($('#fisc-time').html()),
	events:   {
		'click button.btn-primary': 'setTime'
	},
	setTime:  function (e) {
		e.preventDefault();
		console.log('setTime', this.timeView.getDate());
		callProc({addr: '/cgi/proc/setclock', btn: e.target}, this.timeView.getISODate());
		return false;
	}
});

var FiscReset = TimeForm.extend({
	template: _.template($('#fisc-reset').html()),
	events:   {
		'click button.btn-primary': 'doReset',
		'click button.btn-default': 'resetSD'
	},
	render:   function () {
		TimeForm.prototype.render.apply(this, arguments);
		this.$('#receiptNo').val(ecrStatus.get('chkId'));
		this.$('#diNo').val(ecrStatus.get('CurrDI'));
		return this;
	},
	doReset:  function (e) {
		e.preventDefault();
		//console.log('doReset',this.timeView.getDate(),this.$('#receiptNo').val(),this.$('#diNo').val());
		callProc({
			addr: '/cgi/proc/resetram',
			btn:  e.target
		}, this.$('#receiptNo').val(), this.timeView.getISODate(), this.$('#diNo').val());
		return false;
	},
	resetSD:  function (e) {
		e.preventDefault();
		console.log('resetSD');
		callProc({addr: '/cgi/proc/resetmmc', btn: e.target});
		return false;
	}
});
//</editor-fold>

var ReportPage = Backbone.View.extend({
	tagName:       'div',
	events:        {
		'click #xr':                   'xrep',
		'click #zr':                   'zrep',
		'click #pN':                   'prnNum',
		'click #pD':                   'prnDate',
		'click [name="radio-option"]': 'onOptionClick',
		'submit #form-print-ksef':     'printKSEF'
	},
	template:      _.template($('#reports-tmpl').html()),
	render:        function () {
		var self = this;
		$.ajax({
			url:      "/cgi/tbl/FDay",
			dataType: 'json',
			async:    false,
			success:  function (response) {
				var maximumNumber = 0;
				if (_.isArray(response) && !_.isEmpty(response)) {
					maximumNumber = response.length;
				}
				self.$el.html(self.template({
					maximumNumber: maximumNumber
				}));
			}
		});
		return this;
	},
	xrep:          function (e) {
		e.preventDefault();
		callProc({addr: '/cgi/proc/printreport', btn: e.target}, 10);
		return false;
	},
	zrep:          function (e) {
		e.preventDefault();
		callProc({addr: '/cgi/proc/printreport', btn: e.target}, 0);
		return false;
	},
	prnNum:        function (e) {
		e.preventDefault();
		callProc({
			addr: '/cgi/proc/printfmreport',
			btn:  e.target
		}, $('#isShort').prop('checked') ? 4 : 2, '2015-01-01', '2015-01-01', $('#fromN').val(), $('#toN').val());
		return false;
	},
	prnDate:       function (e) {
		e.preventDefault();
		callProc({
			addr: '/cgi/proc/printfmreport',
			btn:  e.target
		}, $('#isShort').prop('checked') ? 3 : 1, toStringDate(new Date($("#fromD").val()), 'y-m-d'), toStringDate(new Date($("#toD").val()), 'y-m-d'), 1, 1);
		return false;
	},
	onOptionClick: function (e) {
		var currentOptionValue = $(e.target).val();
		var inputCheckNumber   = this.$el.find(".check-number");
		switch (parseInt(currentOptionValue)) {
			case 1:
			case 2:
				$(inputCheckNumber).attr('disabled', true);
				break;
			default:
				$(inputCheckNumber).removeAttr('disabled');
				break;
		}
	},
	printKSEF:     function (e) {
		e.preventDefault();
		var fromNumber     = parseInt($("#from-number").val());
		var toNumber       = parseInt($("#to-number").val());
		var number         = $("#report-number").val();
		var selectedOption = $("input[name='radio-option']:checked").val();
		switch (parseInt(selectedOption)) {
			case 1:
				fromNumber = toNumber = 65535;
				break;
			case 2:
				fromNumber = toNumber = 0;
				break;
			case 3:
				var coefficient = 32768;
				fromNumber += coefficient;
				toNumber += coefficient;
				break;
			default:
				break;
		}
		var btn = this.$el.find('#btn-print-ksef');
		callProc({
			addr: '/cgi/proc/printmmcjrn',
			btn:  btn
		}, number, fromNumber, toNumber);
		return false;
	}
});