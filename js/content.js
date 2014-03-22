

(function(window, undefined) {
	
	function querySelector(selector, context) {
		return (context || document).querySelector(selector);
	}
	
	function createElement(tagName, className, $appendTo, html) {
		var $elem = document.createElement(tagName);
		className != null && ($elem.className = className);
		$appendTo && $appendTo.appendChild($elem);
		html != null && ($elem.innerHTML = html);
		return $elem;
	}
	
	function createTextNode(text) {
		return document.createTextNode(text);
	}
	
	function stopEvent(e) {
		e.preventDefault();
		e.stopImmediatePropagation();
	}
	
	
	function show(elem) {
		elem.style.display = "";
	}
	
	function hide(elem) {
		elem.style.display = "none";
	}
	
	
	function on(elem, event, fn) {
		elem.addEventListener(event, fn);
	}
	
	function off(elem, event, fn) {
		elem.removeEventListener(event, fn);
	}
	
	
	function proxy(context, fnName) {
		return function() {
			return context[fnName]();
		};
	}
	
	function cls(className) {
		for (var res = [], i = 0; i < arguments.length; i++) {
			res.push(CLS_MAIN+'-'+arguments[i]);
		}
		return res.join(' ');
	}
	
	
	function Reader(parser) {
		
		function createControl(modifiers, $appendTo, title) {
			var $btn = createElement('div', cls.apply(null, ('control_'+modifiers.join(' control_')).split(' ').concat('control')), $appendTo);
			title != null && $btn.setAttribute('title', title);
			return $btn;
		}
		
		function next() {
			clearTimeout(timeout);
			
			if (!isRunning) return;
			
			if (data = parser.next()) {
				$word.innerHTML = data.word;
				timeout = setTimeout(next, 60000/WPM);
			}
		}
		
		function onWrapperClick() {
			if (isRunning) {
				api.stop();
			}
			else {
				api.start();
			}
		}
		
		
		var api = this,
			isRunning,
			
			$wrapper            = createElement('div', cls('wrapper'), bodyElem),
			
			$envir              = createElement('div', cls('environment'), $wrapper),
			$contextBefore      = createElement('div', cls('context', 'context_before'), $envir),
			$contextAfter       = createElement('div', cls('context', 'context_after'), $envir),
			$word               = createElement('div', cls('word'), $wrapper),
			
			$panelTop           = createElement('div', cls('panel', 'panel_top'), $envir),
			
			$fontAdjust         = createElement('div', cls('adjuster', 'adjuster_font'), $panelTop, '<span>aA</span>'),
			$ctrlDecFont        = createControl(['minus'], $fontAdjust),
			$ctrlIncFont        = createControl(['plus'], $fontAdjust),
			
			$wpmAdjust          = createElement('div', cls('adjuster', 'adjuster_wpm'), $panelTop),
			$wpmText            = createElement('span', null, $wpmAdjust, '200wpm'),
			$ctrlDecWpm         = createControl(['minus'], $wpmAdjust),
			$ctrlIncWpm         = createControl(['plus'], $wpmAdjust),
			
			$panelBot           = createElement('div', cls('panel', 'panel_bottom'), $envir),
			$ctrlStart          = createControl(['start'], $panelBot),
			$ctrlNextWord       = createControl(['nextWord'], $panelBot),
			$ctrlNextSentence   = createControl(['nextSentence'], $panelBot),
			$ctrlGotoEnd        = createControl(['gotoEnd'], $panelBot),
			$ctrlPrevWord       = createControl(['prevWord'], $panelBot),
			$ctrlPrevSentence   = createControl(['prevSentence'], $panelBot),
			$ctrlGotoStart      = createControl(['gotoStart'], $panelBot),
			
			$info               = createElement('div', cls('info'), $wrapper, LNG_TAP_TO_START),
			
			bodyOverflowBefore = bodyElem.style.overflow,
			
			data, timeout;
		
		
		bodyElem.style.overflow = "hidden";
		
		
		api.start = function() {
			if (isRunning) return;
			isRunning = true;
			
			hide($info);
			hide($envir);
			
			next();
		}
		
		api.stop = function() {
			if (!isRunning) return;
			isRunning = false;
			
			show($envir);
			
			$contextBefore.innerHTML = data.before;
			$contextAfter.innerHTML = data.after;
		}
		
		api.isRunning = function() {
			return isRunning;
		}
		
		api.destroy = function() {
			bodyElem.removeChild($wrapper);
			bodyElem.style.overflow = bodyOverflowBefore;
		}
		
		
		on($wrapper, "click", onWrapperClick);
		
	}
	
	function Parser(raw) {
		
		function isLetters(str) {
			return REX_LETTERS_ONLY.test(str);
		}
		
		function isUpperLetters(str) {
			return isLetters(str) && str.toUpperCase() === str;
		}
		
		function isLowerLetters(str) {
			return isLetters(str) && str.toLowerCase() === str;
		}
		
		
		function testForName(text) {
			var len = text.length,
				char, prevChar, nextChar, next2Char,
				match = REX_FEW_LETTERS.exec(text), i;
			
			if (!match) return;
			
			if (match.index === 0) { // `Йитс У.Б. теперь`
				text = text.substring(match[0].length); // ` У.Б. теперь`
				len = text.length;
				
				for (i = 1; i < len; i++) {
					char = text[i];
					prevChar = text[i-1];
					nextChar = text[i+1];
					next2Char = text[i+2];
					
					if (i === 1) {
						if (!isUpperLetters(char) || nextChar !== '.') {
							return;
						}
						i++;
					}
					else if (
						char !== '.'
						&& (char !== ' ' || (next2Char !== undefined && next2Char !== '.') || !isUpperLetters(nextChar))
						&& (!isUpperLetters(char) || isLetters(prevChar) || isLetters(nextChar))
					) {
						return match[0]+text.substring(0, i);
					}
				}
			}
			else { // `У.Б. Йитс теперь`
				var initials = text.substring(0, match.index); // `У.Б. `
				
				if (
					initials.replace(REX_INITIALS, '').length === 0
					&& isUpperLetters(initials.replace(/\.| /g, ''))
				) {
					return initials+match[0];
				}
			}
		}
		
		function testForDigitalEntity(text) {
			var match = REX_DIGITAL_ENTITY.exec(text);
			return match && match[0].trim();
		}
		
		
		function parse() {
			var startPos, startChar,
				char, prevChar, nextChar, next2Char, partAfter, temp;
			
			while (position < textLen) {
				startPos = position;
				startChar = text[position];
				
				for (;position <= textLen; position++) {
					char = text[position];
					prevChar = text[position-1];
					nextChar = text[position+1];
					next2Char = text[position+2];
					partAfter = text.substring(position+1);
					
					if (char === undefined) {
						position++;
						break;
					}
					
					if (
						(position === startPos
							? nextChar === '.' && isUpperLetters(char) // `У.Б. Йитс теперь`
							: char === ' ' && next2Char === '.' && isUpperLetters(startChar) && isUpperLetters(nextChar)) // `Йитс У.Б. теперь`
						&& (temp = testForName(text.substring(startPos, startPos+30))) !== undefined
						&& temp.toUpperCase() !== temp
					) {
						position = startPos+temp.length-1;
						continue;
					}
					
					if (
						(REX_CHAR_DIGIT.test(char) || (char === '+' || REX_CHAR_DASH.test(char)) && REX_CHAR_DIGIT.test(nextChar))
						&& (temp = testForDigitalEntity(text.substring(position, position+20)))
					) {
						if (position !== startPos) {
							if (prevChar === ':') {
								break;
							}
						}
						else {
							position = startPos+temp.length-1;
							continue;
						}
					}
					
					if (char === ' ') {
						if (next2Char === ' ' && REX_CHAR_DASH.test(nextChar)) {
							position = position+2;
						}
						position++;
						break;
					}
				}
				
				data.push({
					// TODO: leave only indexes, not full texts
					before: text.substring(0, startPos),
					after: text.substring(position),
					word: text.substring(startPos, position).trim(),
					type: ENTITY_WORD
				});
			}
		}
		
		
		var api = this,
			text = raw.replace(/\r|\n/gm, ' ').replace(/\s+/g, ' '),
			textLen = text.length,
			position = 0,
			data = [],
			wid = 0;
		
		
		api.next = function() {
			return data[wid++];
		}
		
		
		parse();
		
	}
	
	
	function onKeydown(e) {
		if (!isStarted) return;
		
		switch (e.keyCode) {
			case 27: // esc
				reader.destroy();
				reader = parser = null;
				break;
			
			case 32: // space
				reader.isRunning()
					? reader.stop()
					: reader.start();
				break;
		}
	}
	
	
	var ENTITY_WORD = 0,
		ENTITY_SENTENCE_END = 1,
		
		REX_LETTERS_STR     = '\u0041-\u005A\u0061-\u007A\u00AA\u00B5\u00BA\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02C1\u02C6-\u02D1\u02E0-\u02E4\u02EC\u02EE\u0370-\u0374\u0376-\u0377\u037A-\u037D\u0386\u0388-\u038A\u038C\u038E-\u03A1\u03A3-\u03F5\u03F7-\u0481\u048A-\u0523\u0531-\u0556\u0559\u0561-\u0587\u05D0-\u05EA\u05F0-\u05F2\u0621-\u064A\u066E-\u066F\u0671-\u06D3\u06D5\u06E5-\u06E6\u06EE-\u06EF\u06FA-\u06FC\u06FF\u0710\u0712-\u072F\u074D-\u07A5\u07B1\u07CA-\u07EA\u07F4-\u07F5\u07FA\u0904-\u0939\u093D\u0950\u0958-\u0961\u0971-\u0972\u097B-\u097F\u0985-\u098C\u098F-\u0990\u0993-\u09A8\u09AA-\u09B0\u09B2\u09B6-\u09B9\u09BD\u09CE\u09DC-\u09DD\u09DF-\u09E1\u09F0-\u09F1\u0A05-\u0A0A\u0A0F-\u0A10\u0A13-\u0A28\u0A2A-\u0A30\u0A32-\u0A33\u0A35-\u0A36\u0A38-\u0A39\u0A59-\u0A5C\u0A5E\u0A72-\u0A74\u0A85-\u0A8D\u0A8F-\u0A91\u0A93-\u0AA8\u0AAA-\u0AB0\u0AB2-\u0AB3\u0AB5-\u0AB9\u0ABD\u0AD0\u0AE0-\u0AE1\u0B05-\u0B0C\u0B0F-\u0B10\u0B13-\u0B28\u0B2A-\u0B30\u0B32-\u0B33\u0B35-\u0B39\u0B3D\u0B5C-\u0B5D\u0B5F-\u0B61\u0B71\u0B83\u0B85-\u0B8A\u0B8E-\u0B90\u0B92-\u0B95\u0B99-\u0B9A\u0B9C\u0B9E-\u0B9F\u0BA3-\u0BA4\u0BA8-\u0BAA\u0BAE-\u0BB9\u0BD0\u0C05-\u0C0C\u0C0E-\u0C10\u0C12-\u0C28\u0C2A-\u0C33\u0C35-\u0C39\u0C3D\u0C58-\u0C59\u0C60-\u0C61\u0C85-\u0C8C\u0C8E-\u0C90\u0C92-\u0CA8\u0CAA-\u0CB3\u0CB5-\u0CB9\u0CBD\u0CDE\u0CE0-\u0CE1\u0D05-\u0D0C\u0D0E-\u0D10\u0D12-\u0D28\u0D2A-\u0D39\u0D3D\u0D60-\u0D61\u0D7A-\u0D7F\u0D85-\u0D96\u0D9A-\u0DB1\u0DB3-\u0DBB\u0DBD\u0DC0-\u0DC6\u0E01-\u0E30\u0E32-\u0E33\u0E40-\u0E46\u0E81-\u0E82\u0E84\u0E87-\u0E88\u0E8A\u0E8D\u0E94-\u0E97\u0E99-\u0E9F\u0EA1-\u0EA3\u0EA5\u0EA7\u0EAA-\u0EAB\u0EAD-\u0EB0\u0EB2-\u0EB3\u0EBD\u0EC0-\u0EC4\u0EC6\u0EDC-\u0EDD\u0F00\u0F40-\u0F47\u0F49-\u0F6C\u0F88-\u0F8B\u1000-\u102A\u103F\u1050-\u1055\u105A-\u105D\u1061\u1065-\u1066\u106E-\u1070\u1075-\u1081\u108E\u10A0-\u10C5\u10D0-\u10FA\u10FC\u1100-\u1159\u115F-\u11A2\u11A8-\u11F9\u1200-\u1248\u124A-\u124D\u1250-\u1256\u1258\u125A-\u125D\u1260-\u1288\u128A-\u128D\u1290-\u12B0\u12B2-\u12B5\u12B8-\u12BE\u12C0\u12C2-\u12C5\u12C8-\u12D6\u12D8-\u1310\u1312-\u1315\u1318-\u135A\u1380-\u138F\u13A0-\u13F4\u1401-\u166C\u166F-\u1676\u1681-\u169A\u16A0-\u16EA\u16EE-\u16F0\u1700-\u170C\u170E-\u1711\u1720-\u1731\u1740-\u1751\u1760-\u176C\u176E-\u1770\u1780-\u17B3\u17D7\u17DC\u1820-\u1877\u1880-\u18A8\u18AA\u1900-\u191C\u1950-\u196D\u1970-\u1974\u1980-\u19A9\u19C1-\u19C7\u1A00-\u1A16\u1B05-\u1B33\u1B45-\u1B4B\u1B83-\u1BA0\u1BAE-\u1BAF\u1C00-\u1C23\u1C4D-\u1C4F\u1C5A-\u1C7D\u1D00-\u1DBF\u1E00-\u1F15\u1F18-\u1F1D\u1F20-\u1F45\u1F48-\u1F4D\u1F50-\u1F57\u1F59\u1F5B\u1F5D\u1F5F-\u1F7D\u1F80-\u1FB4\u1FB6-\u1FBC\u1FBE\u1FC2-\u1FC4\u1FC6-\u1FCC\u1FD0-\u1FD3\u1FD6-\u1FDB\u1FE0-\u1FEC\u1FF2-\u1FF4\u1FF6-\u1FFC\u2071\u207F\u2090-\u2094\u2102\u2107\u210A-\u2113\u2115\u2119-\u211D\u2124\u2126\u2128\u212A-\u212D\u212F-\u2139\u213C-\u213F\u2145-\u2149\u214E\u2160-\u2188\u2C00-\u2C2E\u2C30-\u2C5E\u2C60-\u2C6F\u2C71-\u2C7D\u2C80-\u2CE4\u2D00-\u2D25\u2D30-\u2D65\u2D6F\u2D80-\u2D96\u2DA0-\u2DA6\u2DA8-\u2DAE\u2DB0-\u2DB6\u2DB8-\u2DBE\u2DC0-\u2DC6\u2DC8-\u2DCE\u2DD0-\u2DD6\u2DD8-\u2DDE\u2E2F\u3005-\u3007\u3021-\u3029\u3031-\u3035\u3038-\u303C\u3041-\u3096\u309D-\u309F\u30A1-\u30FA\u30FC-\u30FF\u3105-\u312D\u3131-\u318E\u31A0-\u31B7\u31F0-\u31FF\u3400\u4DB5\u4E00\u9FC3\uA000-\uA48C\uA500-\uA60C\uA610-\uA61F\uA62A-\uA62B\uA640-\uA65F\uA662-\uA66E\uA67F-\uA697\uA717-\uA71F\uA722-\uA788\uA78B-\uA78C\uA7FB-\uA801\uA803-\uA805\uA807-\uA80A\uA80C-\uA822\uA840-\uA873\uA882-\uA8B3\uA90A-\uA925\uA930-\uA946\uAA00-\uAA28\uAA40-\uAA42\uAA44-\uAA4B\uAC00\uD7A3\uF900-\uFA2D\uFA30-\uFA6A\uFA70-\uFAD9\uFB00-\uFB06\uFB13-\uFB17\uFB1D\uFB1F-\uFB28\uFB2A-\uFB36\uFB38-\uFB3C\uFB3E\uFB40-\uFB41\uFB43-\uFB44\uFB46-\uFBB1\uFBD3-\uFD3D\uFD50-\uFD8F\uFD92-\uFDC7\uFDF0-\uFDFB\uFE70-\uFE74\uFE76-\uFEFC\uFF21-\uFF3A\uFF41-\uFF5A\uFF66-\uFFBE\uFFC2-\uFFC7\uFFCA-\uFFCF\uFFD2-\uFFD7\uFFDA-\uFFDC'.replace('\\', '\\\\'),
		REX_LETTERS_ONLY    = RegExp('^['+REX_LETTERS_STR+']+$'),
		REX_FEW_LETTERS     = RegExp('['+REX_LETTERS_STR+']{2,}'),
		REX_INITIALS        = RegExp('['+REX_LETTERS_STR+']\\. ?','g'),
		REX_DIGITAL_ENTITY  = /^\+?\-?\d[\d\(\) \-]+/,
		REX_CHAR_DASH       = /^-|–|—$/,
		REX_CHAR_DIGIT      = /^\d$/,
		
		CLS_MAIN = 'e-FastReader',
		
		LNG_TAP_TO_START = "Click the screen or press space bar to start.",
		
		WPM = 200,
		
		fastReader = window.fastReader = {},
		isStarted,
		
		bodyElem = querySelector('body'),
		
		reader, parser;
	
	
	
	fastReader.start = function() {
		isStarted && fastReader.stop();
		isStarted = true;
		
		var text = window.getSelection().toString().trim();
		if (text.length > 0) {
			parser = new Parser(text);
			reader = new Reader(parser);
			
			on(window, "keydown", onKeydown);
		}
	}
	
	fastReader.stop = function() {
		isStarted = false;
		off(window, "keydown", onKeydown);
	}
	
	
	
	
	
	
	function testParser() {
		
		var tests = [
			['General'],
			['one two three',               'one two three'.split(/\s+/)],
			['one t-w-o three',             'one t-w-o three'.split(/\s+/)],
			['one		two		three',     'one		two		three'.split(/\s+/)],
			['one (two three) four',        'one (two three) four'.split(/\s+/)],
			
			['Compound words'],
			['прекратила существование Лента.ру, у нас',            ['прекратила','существование','Лента.ру,','у','нас']],
			['так считают, по-моему, уже',                          ['так','считают,','по-моему,','уже']],
			
			['Punctuation'],
			['так же, как... Понятно',                              ['так','же,','как...','Понятно']],
			['третья неделя - это, конечно',                        ['третья','неделя -','это,','конечно']],
			['третья неделя – это, конечно',                        ['третья','неделя –','это,','конечно']],
			['третья неделя — это, конечно',                        ['третья','неделя —','это,','конечно']],
			
			['Digital entities'],
			['был запущен в 30-е годы',                             ['был','запущен','в','30-е','годы']],
			['так считают 36%, по-моему, уже',                      ['так','считают','36%,','по-моему,','уже']],
			['значит те 30-50 тысяч',                               ['значит','те','30-50','тысяч']],
			['значит те -30°C что',                                 ['значит','те','-30°C','что']],
			['значит те -30*2 что',                                 ['значит','те','-30*2','что']],
			['значит это:-30*2. Что',                               ['значит','это:','-30*2.','Что']],
			['значит аи92. Что',                                    ['значит','аи92.','Что']],
			['думает другое. +7 985 970-45-45. И, собственно',      ['думает','другое.','+7 985 970-45-45.','И,','собственно']],
			['думает другое +7 985 970-45-45 И, собственно',        ['думает','другое','+7 985 970-45-45','И,','собственно']],
			['думает другое:+7 (985) 970-45-45 И, собственно',      ['думает','другое:','+7 (985) 970-45-45','И,','собственно']],
			['думает другое. 7 985 970-45-45. И, собственно',       ['думает','другое.','7 985 970-45-45.','И,','собственно']],
			['думает другое. 7 (985) 970-45-45. И, собственно',     ['думает','другое.','7 (985) 970-45-45.','И,','собственно']],
			['думает другое: 123-45-67. И, собственно',             ['думает','другое:','123-45-67.','И,','собственно']],
			['думает другое:123-45-67. И, собственно',              ['думает','другое:','123-45-67.','И,','собственно']],
			
			['Initials'],
			['Добрый вечер. Ю. Латынина, «Код доступа»',            ['Добрый','вечер.','Ю. Латынина,','«Код','доступа»']],
			['Добрый вечер. Я Латынина Ю. Код доступа',             ['Добрый','вечер.','Я','Латынина Ю.','Код','доступа']],
			['Добрый вечер. Я Латынина Ю. код доступа',             ['Добрый','вечер.','Я','Латынина Ю.','код','доступа']],
			['ну Латынина Ю. понятно теперь',                       ['ну','Латынина Ю.','понятно','теперь']],
			['ну Й.К.Л. Прильвиц понятно теперь',                   ['ну','Й.К.Л. Прильвиц','понятно','теперь']],
			['ну У. Б. Йитс понятно теперь',                        ['ну','У. Б. Йитс','понятно','теперь']],
			['НУ У. Б. ЙИТС ПОНЯТНО ТЕПЕРЬ',                        ['НУ','У.','Б.','ЙИТС','ПОНЯТНО','ТЕПЕРЬ']],
			['ну У.Б.Йитс понятно теперь',                          ['ну','У.Б.Йитс','понятно','теперь']],
			['ну Йитс У. Б. понятно теперь',                        ['ну','Йитс У. Б.','понятно','теперь']],
			['ну Йитс У.Б. понятно теперь',                         ['ну','Йитс У.Б.','понятно','теперь']],
			['ну Йитс У.Б., понятно теперь',                        ['ну','Йитс У.Б.,','понятно','теперь']],
			['НУ ЙИТС У.Б. ПОНЯТНО ТЕПЕРЬ',                         ['НУ','ЙИТС','У.Б.','ПОНЯТНО','ТЕПЕРЬ']],
			['Йитс У.Б. понятно теперь',                            ['Йитс У.Б.','понятно','теперь']],
			['Йитс У.Б... понятно теперь',                          ['Йитс У.Б...','понятно','теперь']],
			['Ю. Латынина, «Код доступа»',                          ['Ю. Латынина,','«Код','доступа»']],
			['это Доступа КОД на Эхе',                              ['это','Доступа','КОД','на','Эхе']],
			
			[]
		];
		
		var STYLE_OK    = 'background:#cfc; color:#080;',
			STYLE_FAIL  = 'background:#fdd; color:#d00;',
			
			test, parser, words, consoleArgs, next, word, res, i, k;
		
		for (i = 0; i < tests.length; i++) {
			test = tests[i];
			
			if (!test.length) {
				continue;
			}
			else if (test.length === 1) {
				console.groupEnd();
				console.group(test[0]);
			}
			else {
				parser = new Parser(test[0]);
				
				res = true;
				words = [];
				consoleArgs = [];
				
				for (k = 0; next = parser.next(); k++) {
					word = next.word;
					
					words.push(word);
					
					if (word !== test[1][k]) {
						res = false;
					}
					
					consoleArgs.push(res ? STYLE_OK : STYLE_FAIL, '');
				}
				
				if (!k && test[1].length) {
					res = false;
				}
				
				console.log.apply(console, ['%c<'+(res ? ' OK ' : 'Fail')+'>%c '+test[0]+' >>> %c'+ words.join('%c, %c')+'%c'].concat(res ? STYLE_OK : STYLE_FAIL, '', consoleArgs));
			}
		}
		
		console.groupEnd();
	}
	
	//testParser();
	
	
	
	// http://forums.mozillazine.org/viewtopic.php?f=25&t=834075
})(window);
