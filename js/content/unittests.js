

(function(app) {
	
	function getStyle(res) {
		return res ? STYLE_OK : STYLE_FAIL;
	}
	
	
	var STYLE_OK    = 'background:#cfc; color:#080;',
		STYLE_FAIL  = 'background:#fdd; color:#d00;',
		
		settings = {
			entityAnalysis: true
		},
		mackApp = {
			get: function(key) {
				return settings[key];
			}
		};
	
	
	app.testParser = function() {
		
		var tests = [
				['General'],
				['one two three',                                       '001',      '00100000', ['one','two','three']],
				['one t-w-o three',                                     '011',      '00100000', ['one','t-w-o','three']],
				['one		two		three',                             '001',      '00100000', ['one','two','three']],
				['one (two three) four',                                '0001',     '00010000', ['one','(two','three)','four']],
				
				['Compound words'],
				['прекратила существование Лента.ру, у нас',            '00101',    '00001000', ['прекратила','существование','Лента.ру,','у','нас']],
				['прекратила существование Лента.Ру, у нас',            '00101',    '00001000', ['прекратила','существование','Лента.Ру,','у','нас']],
				['так считают, по-моему, уже',                          '0111',     '00010000', ['так','считают,','по-моему,','уже']],
				['так считают 0:07 уже',                                '0011',     '00010000', ['так','считают','0:07','уже']],
				['так считают 0:07:123 уже',                            '0011',     '00010000', ['так','считают','0:07:123','уже']],
				['князь-Григорию Ой-й-й-йоой!',                         '11',       '01000000', ['князь-Григорию','Ой-й-й-йоой!']],
				['несчастная-а-а! пло-о-охо-о-о',                       '11',       '11000000', ['несчастная-а-а!','пло-о-охо-о-о']],
				
				['Punctuation'],
				['так же, как... Понятно',                              '0111',     '00110000', ['так','же,','как...','Понятно']],
				['третья неделя - это, конечно',                        '0111',     '00010000', ['третья','неделя -','это,','конечно']],
				['третья неделя – это, конечно',                        '0111',     '00010000', ['третья','неделя —','это,','конечно']],
				['третья неделя — это, конечно',                        '0111',     '00010000', ['третья','неделя —','это,','конечно']],
				['это, конечно ...',                                    '11',       '01000000', ['это,','конечно ...']],
				['это, конечно ...ну... знаете',                        '1111',     '01110000', ['это,','конечно ...','ну...','знаете']],
				['сказал "ну, конечно ..." и ушёл',                     '01101',    '00101000', ['сказал','"ну,','конечно ..."','и','ушёл']],
				['"ну, конечно ..."— сказал и ушёл',                    '11001',    '01001000', ['"ну,','конечно ..."—','сказал','и','ушёл']],
				['Может они "разгадали" его',                           '0001',     '00010000', ['Может','они','"разгадали"','его']],
				['слабости"."Он показывает',                            '101',       '10100000', ['слабости".','"Он','показывает']],
				['слабости.-Он показывает',                             '101',      '10100000', ['слабости.','-Он','показывает']],
				['свидание!""Смотрите',                                 '11',       '11000000', ['свидание!"','"Смотрите']],
				['свидание!". Смотрите',                                '11',       '11000000', ['свидание!".','Смотрите']],
				['свидание! "Смотрите',                                 '11',       '11000000', ['свидание!','"Смотрите']],
				['свидание! ""Смотрите',                                '11',       '11000000', ['свидание! "','"Смотрите']],
				['свидание!\n"Смотрите',                                '11',       '11000000', ['свидание!','"Смотрите']],
				['свидание« Смотрите',                                  '01',       '01000000', ['свидание«','Смотрите']],
				
				['Brackets'],
				['сюжет (видео вставка) отличный',                      '0001',     '00010000', ['сюжет','(видео','вставка)','отличный']],
				['сюжет ( видео вставка ) отличный',                    '0001',     '00010000', ['сюжет','(видео','вставка)','отличный']],
				['да, это здорово))))) хорошо',                         '1011',     '00010000', ['да,','это','здорово)))))','хорошо']],
				['сюжет. [видео вставка]: "Официальные',                '1011',     '10010000', ['сюжет.','[видео','вставка]:','"Официальные']],
				['сюжет.[видео вставка]:"Официальные',                  '1011',     '10010000', ['сюжет.','[видео','вставка]:','"Официальные']],
				
				['Lists'],
				['Следующие\n• Гипертрофированный протекционизм',      '111',       '10100000', ['Следующие','• Гипертрофированный','протекционизм']],
				['Следующие:\n• Гипертрофированный протекционизм',     '111',       '10100000', ['Следующие:','• Гипертрофированный','протекционизм']],
				['Следующие:\n1. Гипертрофированный протекционизм',    '111',       '10100000', ['Следующие:','1. Гипертрофированный','протекционизм']],
				['Следующие:\n1.Гипертрофированный протекционизм',     '111',       '10100000', ['Следующие:','1.Гипертрофированный','протекционизм']],
				['Следующие:\n1) Гипертрофированный протекционизм',    '111',       '10100000', ['Следующие:','1) Гипертрофированный','протекционизм']],
				['Следующие:\n1)Гипертрофированный протекционизм',     '111',       '10100000', ['Следующие:','1)Гипертрофированный','протекционизм']],
				['протестующих а) наймитами Запада и б) создал',       '0000001',   '00000010', ['протестующих','а)','наймитами','Запада','и','б)','создал']],
				
				['Multiline'],
				['сказал\nПривет',                                      '11',       '11000000', ['сказал','Привет']],
				['сказал   \n  Привет',                                 '11',       '11000000', ['сказал','Привет']],
				['сказал   \n  -Привет',                                '11',       '11000000', ['сказал','-Привет']],
				['сказал:\n— Привет',                                  '11',        '11000000', ['сказал:','— Привет']],
				['сказал:- Привет',                                     '11',       '01000000', ['сказал:','- Привет']],
				
				['Digital entities'],
				['был запущен в 30-е годы',                             '00011',    '00001000', ['был','запущен','в','30-е','годы']],
				['так считают 36%, по-моему, уже',                      '00111',    '00001000', ['так','считают','36%,','по-моему,','уже']],
				['значит те 30-50 тысяч',                               '0011',     '00010000', ['значит','те','30-50','тысяч']],
				['значит те -30°C что',                                 '0011',     '00010000', ['значит','те','-30°C','что']],
				['значит те -30*2 что',                                 '0011',     '00010000', ['значит','те','-30*2','что']],
				['значит это:-30*2. Что',                               '0111',     '00110000', ['значит','это:','-30*2.','Что']],
				['значит аи92. Что',                                    '011',      '01100000', ['значит','аи92.','Что']],
				['думает другое. +7 985 970-45-45. И, собственно',      '01111',    '01101000', ['думает','другое.','+7 985 970-45-45.','И,','собственно']],
				['думает другое +7 985 970-45-45 И, собственно',        '00111',    '00001000', ['думает','другое','+7 985 970-45-45','И,','собственно']],
				['думает другое:+7 (985) 970-45-45 И, собственно',      '01111',    '00001000', ['думает','другое:','+7 (985) 970-45-45','И,','собственно']],
				['думает другое:7 985 970-45-45. И, собственно',        '01111',    '00101000', ['думает','другое:','7 985 970-45-45.','И,','собственно']],
				['думает другое. 7 (985) 970-45-45. И, собственно',     '01111',    '01101000', ['думает','другое.','7 (985) 970-45-45.','И,','собственно']],
				['думает другое: 123-45-67. И, собственно',             '01111',    '00101000', ['думает','другое:','123-45-67.','И,','собственно']],
				['думает другое:123-45-67. И, собственно',              '01111',    '00101000', ['думает','другое:','123-45-67.','И,','собственно']],
				['В полночь 25 марта 2014 года начался',                '0000001',  '00000010', ['В','полночь','25','марта','2014','года','начался']],
				
				['Initials'],
				['Добрый вечер. Ю. Латынина, «Код доступа»',            '01101',    '01001000', ['Добрый','вечер.','Ю. Латынина,','«Код','доступа»']],
				['Добрый вечер. Я Латынина Ю. Код доступа',             '010101',   '01000100', ['Добрый','вечер.','Я','Латынина Ю.','Код','доступа']],
				['Добрый вечер. Я Латынина Ю. код доступа',             '010101',   '01000100', ['Добрый','вечер.','Я','Латынина Ю.','код','доступа']],
				['ну Латынина Ю. понятно теперь',                       '0101',     '00010000', ['ну','Латынина Ю.','понятно','теперь']],
				['ну Й.К.Л. Прильвиц понятно теперь',                   '0101',     '00010000', ['ну','Й.К.Л. Прильвиц','понятно','теперь']],
				['ну У. Б. Йитс понятно теперь',                        '0101',     '00010000', ['ну','У. Б. Йитс','понятно','теперь']],
				//['НУ У. Б. ЙИТС ПОНЯТНО ТЕПЕРЬ',                        '011001',   '00000100', ['НУ','У.','Б.','ЙИТС','ПОНЯТНО','ТЕПЕРЬ']],
				['ну У.Б.Йитс понятно теперь',                          '0101',     '00010000', ['ну','У.Б.Йитс','понятно','теперь']],
				['ну Йитс У. Б. понятно теперь',                        '0101',     '00010000', ['ну','Йитс У. Б.','понятно','теперь']],
				['ну Йитс У.Б. понятно теперь',                         '0101',     '00010000', ['ну','Йитс У.Б.','понятно','теперь']],
				['ну Йитс У.Б., понятно теперь',                        '0101',     '00010000', ['ну','Йитс У.Б.,','понятно','теперь']],
				//['НУ ЙИТС У.Б. ПОНЯТНО ТЕПЕРЬ',                         '00101',    '00001000', ['НУ','ЙИТС','У.Б.','ПОНЯТНО','ТЕПЕРЬ']],
				['Йитс У.Б. понятно теперь',                            '101',      '00100000', ['Йитс У.Б.','понятно','теперь']],
				['Йитс У.Б... понятно теперь',                          '101',      '10100000', ['Йитс У.Б...','понятно','теперь']],
				['Ю. Латынина, «Код доступа»',                          '101',      '00100000', ['Ю. Латынина,','«Код','доступа»']],
				['это Доступа КОД на Эхе',                              '00001',    '00001000', ['это','Доступа','КОД','на','Эхе']],
				
				[]
			],
			
			test,
			raw, parts, delay, sentences,
			parser, next,
			actualParts, actualDelays, actualSentences,
			consoleArgs, consoleStr, partStyles,
			res_parts, res_delays, res_sentences, res_total,
			res = true, i, k;
		
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
				raw = test[0];
				delay = test[1];
				sentences = test[2];
				parts = test[3];
				
				actualParts = [];
				actualDelays = [];
				actualSentences = [];
				partStyles = [];
				
				res_parts = res_delays = res_sentences = true;
				
				parser = new app.Parser(raw, mackApp);
				parser.parse();
				
				for (k = 0; next = parser.nextWord(); k++) {
					actualParts.push(next.word);
					actualDelays.push(+next.isDelayed+'');
					actualSentences.push(+next.isSentenceEnd+'');
					
					partStyles.push(getStyle(actualParts[k] === parts[k]), '');
					if (actualDelays[k] !== delay[k]) res_delays = false;
					if (actualSentences[k] !== sentences[k]) res_sentences = false;
					
					if (parser.isLastWord()) {
						break;
					}
				}
				
				if (!k && parts.length) {
					res_parts = false;
				}
				
				if (!(res_total = res_parts && res_delays && res_sentences)) {
					res = false;
				}
				
				
				consoleArgs = [];
				consoleStr = [];
				
				consoleStr.push('%c<'+(res_total ? ' OK ' : 'Fail')+'>%c');
				consoleArgs.push(getStyle(res_total), '');
				
				consoleStr.push(raw.replace(/\n/g, '\\n'));
				
				consoleStr.push('>>> %c'+actualDelays.join('')+'%c');
				consoleArgs.push(getStyle(res_delays), '');
				
				consoleStr.push('>>> %c'+actualSentences.join('')+'%c');
				consoleArgs.push(getStyle(res_sentences), '');
				
				consoleStr.push('>>> %c'+actualParts.join('%c, %c')+'%c');
				consoleArgs = consoleArgs.concat(partStyles);
				
				console.log.apply(console, [consoleStr.join(' ')].concat(consoleArgs));
			}
		}
		
		console.groupEnd();
		
		console.log('%c<<< '+(res ? 'All tests passed' : 'Some tests failed')+' >>>%c', getStyle(res), '');
	}
	//app.testParser();
	
})(window.fastReader);
