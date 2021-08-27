// Gakujo Text Count / author:@yuratwc
// Version 0.4.0

(function() {

	const BRWS = browser || chrome;

	const CHAR_LF = "\n";
	const CHAR_CR = "\r";
	const CHAR_CRLF = CHAR_CR + CHAR_LF;

	/*
		改行コードを考慮した文字列の長さを返す
	*/
	function calcLength(str) {
		if(!str) return 0;
		str = str.replaceAll(CHAR_CRLF, CHAR_LF);
		str = str.replaceAll(CHAR_CR, CHAR_LF);
		str = str.replaceAll(CHAR_LF, CHAR_CRLF);
		return str.length;
	}

	/*
		指定されたDOMの後にlabelを挿入する
		br:true指定するとbrタグの後に挿入する
	*/
	function addLabel(dom, labelid, br) {
		let par = dom.parentNode;
		let lab = document.createElement("span");
		lab.setAttribute("id", labelid);
		let labContent = document.createTextNode(" " + calcLength(this.value) + " 文字");
		lab.appendChild(labContent);
		if(br) {
			const newline = document.createElement("br");
			par.insertBefore(newline, dom.nextSibling);
			par.insertBefore(lab, newline.nextSibling);
		} else {
			par.insertBefore(lab, dom.nextSibling);
		}
		dom.labelId = labelid;
		let eventContent = function() {
			document.getElementById(this.labelId).innerText = " " + calcLength(this.value) + " 文字";
		};
		// コピペ時に文字数の計算が行われるように各種イベントを登録しておく
		dom.addEventListener('change', eventContent);
		dom.addEventListener('keyup', eventContent);
		dom.addEventListener('keydown', eventContent);
		dom.addEventListener('keypress', eventContent);
		dom.addEventListener('click', eventContent);
		dom.addEventListener('mousemove', eventContent);
	}
	
	///Text-Count for textarea
	(function() {
		let inputs = document.querySelectorAll('textarea');
		for(let i = 0; i < inputs.length; i++) {
			let inp = inputs[i];
			const labelid = "textarea-gakujo-input-area-label-" + i;
			addLabel(inp, labelid, false);
		}
	})();
	
	//text count for input
	(function() {
		let inputs = document.querySelectorAll('input[type="text"]:not(.hasDatepicker)');
		for(let i = 0; i < inputs.length; i++) {
			let inp = inputs[i];
			const labelid = "textarea-gakujo-input-input-label-" + i;
			addLabel(inp, labelid, true);
		}
	})();

	// video connect
	// 時間割欄から動画へのリンクを貼る
	(function() {
		const today = new Date();
		const m = today.getMonth();
		let year = today.getFullYear();
		if(m >= 0 && m <= 2) {
			year--;
		}

		let tds = document.querySelectorAll("table.t_timetable > tbody > tr > td");
		for(let i = 0; i < tds.length; i++) {
			let td = tds[i];
			if(td.getAttribute("valign") != "top")
				continue;
			const str = td.innerHTML.replace(/s+/g, "").replace("　", "");
			let lines = str.split('<br>');
			if(lines.length != 4)
				continue;
			const name = lines[0].replace(/（.+）/g, "");
			const instructor = lines[1].replace(/　他/g, "");
			const videoUrl = 'https://gakujo.shizuoka.ac.jp/portal/educationalvideo/search/params/locale=ja&faculty=&department=&course=' + name + '&year=' + year + '&facultyCode=&instructor=' + instructor;
			const hyperlink = document.createElement("a");
			hyperlink.setAttribute('target', '_blank');
			hyperlink.setAttribute('style', 'font-size:1.2em;');
			hyperlink.setAttribute('href', videoUrl);
			hyperlink.appendChild(document.createTextNode("\ud83c\udfa6"));	//絵文字
			td.appendChild(hyperlink);
		}
	})();

	// 成績 CSVのダウンロード機構と、成績欄の先生の名前を非表示にするボタンを追加
	(function() {
		const form = document.querySelector('form[name=SeisekiStudentForm]');
		if(!form)
			return;

		const trtag = document.querySelector('tr[bgcolor=\\#6699FF]');
		if(!trtag)
			return;
		
		const tableParent = document.querySelector('table.txt12 > tbody:nth-child(1)');
		for(let i = 1; i < tableParent.children.length; i++) {
			const children = tableParent.children[i].children;
			if(children.length == 11) {
				children[1].children[0].classList.add('teacher-name-class');
			}
		}

		const btnCSV = document.createElement('a');
		btnCSV.setAttribute('href', '#');
		btnCSV.setAttribute('download', 'grades.csv');
		btnCSV.appendChild(document.createTextNode("CSVダウンロード"));
		btnCSV.addEventListener('click', evt => {
			const bom = new Uint8Array([0xEF, 0xBB, 0xBF]);	// 文字化け対策にUTF8のBOMを入れておく
			let csv = '';
			for(let i = 0; i < tableParent.children.length; i++) {
				const children = tableParent.children[i].children;
				for(let j = 0; j < children.length; j++) {
					let text =  children[j].textContent.trim().replace(/\r?\n/g, '').trim();
					csv += text + ',';
				}
				csv += '\r\n';
			}
			const blob = new Blob([bom, csv], {type: "text/csv;charset=utf-8"});
			const url = window.URL.createObjectURL(blob);
			btnCSV.href = url;
		});
		const btnTeacher = document.createElement('input');
		btnTeacher.setAttribute('type', 'button');
		btnTeacher.setAttribute('value', '先生の名前を非表示');
		btnTeacher.addEventListener('click', evt => {
			const alle = document.querySelectorAll('.teacher-name-class');
			for(let i = 0; i < alle.length; i++) {
				if(!alle[i].style.display || alle[i].style.display=='inline') {
					alle[i].style.display = 'none';
				} else {
					alle[i].style.display = 'inline';
				}
			}
		});
		form.parentElement.insertBefore(btnTeacher, form.nextSibling);
		form.parentElement.insertBefore(btnCSV, form.nextSibling);


		
	})();

	// 戻るボタンを使えるようにする仕組み
	(function() {
		BRWS.storage.sync.get('backing', function(result) {
			if(!result.backing) return;
			// ページ内に戻るとして機能しそうなボタンを探す
			const buttons = [
				document.querySelector(".icon-back"),
				document.querySelector("img[alt='戻る']"),
				document.querySelector("img[src$='modoru.gif']"),
				document.querySelector("h1 a")
			].filter(t => t);
	
			if(buttons.length > 0) {
				history.pushState(null, null, null);	//あらかじめ空のページを戻るの履歴に追加しておく
				window.onpopstate = () => {
					buttons[0].click();			//その空のページへの戻るが発生したときに，ページ内の押せそうなボタンを押す
					return;
				}
			}
		});
	})();

})();