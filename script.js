// Executes once the entire page is loaded.
window.onload = function() {
	// Tests localStorage. If not usable, ends the execution.
	localStorage.setItem("storage_test", "test");
	if (localStorage.getItem("storage_test") === "test") {
		localStorage.removeItem("storage_test");
	} else {
		alert("Local storage is not available or enabled. Import and export functions cannot be used.");
		return;
	}
	
	/**
	 * Gets cookie value if cookie exists. If not, returns an empty string. Adapted from: https://www.w3schools.com/js/js_cookies.asp
	 * @param {string} cname - Name of the cookie.
	 * @returns {string} - Cookie content.
	 */
	function get_cookie(cname) {
		let name = cname + "=";
		let decodedCookie = document.cookie;
		let ca = decodedCookie.split(";");
		for(let i = 0; i < ca.length; i++) {
			let c = ca[i];
			while (c.charAt(0) == " ") {
				c = c.substring(1);
			}
			if (c.indexOf(name) == 0) {
				return c.substring(name.length, c.length);
			}
		}
		return "";
	}
	
	/**
	 * Sets cookie. Adapted from: https://www.w3schools.com/js/js_cookies.asp
	 * @param {string} cname - Name of the cookie.
	 * @param {string} cvalue - Value of the cookie.
	 * @param {number} exdays - Number of days for which the cookie will be stored.
	 */
	function set_cookie(cname, cvalue, exdays=365) {
		const d = new Date();
		d.setTime(d.getTime() + (exdays*24*60*60*1000));
		let expires = "expires=" + d.toUTCString();
		document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
	}
	
	/**
	 * Creates and downloads a file.
	 * @param {string} filename - Name of the file, including its extension.
	 * @param {string} content - Content to be downloaded.
	 */
	function download_file(filename, content) {
		let element = document.createElement("a");
		element.setAttribute("href", "data:text/plain;charset=utf-8," + encodeURIComponent(content));
		element.setAttribute("download", filename);
		element.style.display = "none";
		document.body.appendChild(element);
		element.click();
		document.body.removeChild(element);
	}
	
	/**
	 * Converts MD content to a file and inserts it into localStorage.
	 * @param {string} content - Contents of the MD file.
	 * @param {string} filename - Name of the file, excluding its extension, to be used in localStorage.
	 * @returns {boolean} - Import success.
	 */
	function md_to_file(content, filename=null) {	
		content = content.trim();
		if (!content) {
			if (filename) {
				alert(filename + ".md is empty.");
			}
			return false;
		}
		let storage = JSON.parse(localStorage.getItem("WebPPLEditorState"));
		// Decides on the ID by looking at the last file's ID.
		let current_id = parseInt(Object.keys(storage["files"]).at(-1)) + 1;
		let tilde_starts = [];
		let tilde_start = content.indexOf("~~~~");
		while (tilde_start != -1) {
			tilde_starts.push(tilde_start);
			tilde_start = content.indexOf("~~~~", tilde_start + 1);
		}
		if (tilde_starts.length % 2 != 0) {
			if (filename) {
				alert(filename + ".md could not be parsed. Check for syntax errors.");
			} else {
				alert("Text could not be parsed. Check for syntax errors.");
			}
			return false;
		} else {
			// Pasted files do not have filename.
			filename = filename || "Pasted file";
			let file = {"name": filename, "blocks": {}};
			if (tilde_starts.length < 1) {
				file["blocks"][0] = {"type": "text", "content": content.trim(), "orderingKey": 0};
			} else {
				let block_counter = 0;
				let substr = content.substring(0, tilde_starts[0]).trim();
				if (substr) {
					file["blocks"][block_counter] = {"type": "text", "content": substr, "orderingKey": block_counter};
					block_counter += 1;
				}
				for (let i = 0; i < tilde_starts.length; i += 2) {
					// The code is assumed to start not after four consecutive tildes but with the new line that comes after them. 
					let code = content.substring(content.indexOf("\n", tilde_starts[i]+4)+1, tilde_starts[i+1]).trim();
					if (code) {
						file["blocks"][block_counter] = {"type": "code", "content": code, "orderingKey": block_counter};
						block_counter += 1;
					}
					let text = content.substring(tilde_starts[i+1]+4, tilde_starts[i+2]).trim();
					if (text) {
						file["blocks"][block_counter] = {"type": "text", "content": text, "orderingKey": block_counter};
						block_counter += 1;
					}
				}
			}
			storage["files"][current_id] = file;
			storage["selectedFile"] = current_id;
			localStorage.setItem("WebPPLEditorState", JSON.stringify(storage));		
			return true;
		}
	}
	
	/**
	 * Converts CSV to an array. Adapted from: https://stackoverflow.com/a/8497474/4825304
	 * @param {string} text - Contents of the CSV file.
	 * @param {string} separator - A non-whitespace separator.
	 * @returns {array} - Text converted into an array.
	 */
	function csv_to_array(text, separator) {
		separator = separator.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'); // Escaping for RegExp
		
		let re_valid = new RegExp(`^\\s*(?:\'[^\'\\\\]*(?:\\\\[\\S\\s][^\'\\\\]*)*\'|\"[^\"\\\\]*(?:\\\\[\\S\\s][^\"\\\\]*)*\"|[^${separator}\'\"\\s\\\\]*(?:\\s+[^${separator}\'\"\\s\\\\]+)*)\\s*(?:${separator}\\s*(?:\'[^\'\\\\]*(?:\\\\[\\S\\s][^\'\\\\]*)*\'|\"[^\"\\\\]*(?:\\\\[\\S\\s][^\"\\\\]*)*\"|[^${separator}\'\"\\s\\\\]*(?:\\s+[^${separator}\'\"\\s\\\\]+)*)\\s*)*\$`);
		
		let re_value = new RegExp(`(?!\\s*\$)\\s*(?:\'([^\'\\\\]*(?:\\\\[\\S\\s][^\'\\\\]*)*)\'|\"([^\"\\\\]*(?:\\\\[\\S\\s][^\"\\\\]*)*)\"|([^${separator}\'\"\\s\\\\]*(?:\\s+[^${separator}\'\"\\s\\\\]+)*))\\s*(?:${separator}|\$)`, "g");
		
		// Returns NULL if input string is not well formed CSV string.
		if (!re_valid.test(text)) return null;
		let a = []; // Initialize array to receive values.
		text.replace(re_value, // "Walk" the string using replace with callback.
			function(m0, m1, m2, m3) {
				// Removes backslash from \' in single quoted values.
				if (m1 !== undefined) a.push(m1.replace(/\\'/g, "'"));
				// Removes backslash from \" in double quoted values.
				else if (m2 !== undefined) a.push(m2.replace(/\\"/g, '"'));
				else if (m3 !== undefined) a.push(m3);
				return ''; // Return empty string.
			});
		// Handles special case of empty last value.
		if (/,\s*$/.test(text)) a.push('');
		return a;
	}
	
	/**
	 * Converts CSV or JSON content to a variable.
	 * @param {string} content - Contents of the MD file.
	 * @param {string} filename - Name of the file, excluding its extension, to be used in localStorage.
	 * @param {string} separator - Separator that will be used to separate values in the row (for CSV files).
	 * @param {boolean} has_headers - A boolean indicating whether the dataset has headers (for CSV files).
	 * @param {boolean} use_headers - A boolean indicating whether the headers will be used for column naming (for CSV files).
	 * @param {string} orientation - A string indicating whether the dataset will be imported in row-first or column-first format.
	 * @returns {string} - Imported dataset variable.
	 */
	function dataset_to_variable(content, filename, separator=",", has_headers=true, use_headers=true, orientation="row") {
		content = content.trim().replace(/\r\n/g, "\n\n");
		if (!content) {
			if (filename) {
				alert("Dataset file is empty.");
			}
			return false;
		}
		let last_period = filename.lastIndexOf(".");
		let dataset_name = filename.substring(0, last_period);
		if (/^\d/.test(dataset_name)) {
			dataset_name = "dataset_" + dataset_name;
		}
		let dataset_format = filename.substring(last_period+1).toLowerCase();
		
		let variable;
		if (dataset_format == "json") {
			// Handles JSON.
			variable = "var " + dataset_name + " = " + content + ";";
		} else {
			// Handles CSV.
			variable = "var " + dataset_name + " = ";
			if (orientation == "row") { // Row-first
				variable += "[";
			}
			let rows = content.split("\n\n");
			let columns = [];
			
			// Does not treat the first row as data if it is declared the dataset has headers.
			let row_start = 1;
			if (!has_headers) {
				use_headers = false;
				row_start = 0;
			}
			
			let row_format;
			if (use_headers) {
				columns = csv_to_array(rows[0], separator);
				row_format = {}
			} else {
				let row = csv_to_array(rows[0], separator);
				columns = [...Array(row.length).keys()];
				row_format = [];
			}
			
			let simplify = false;
			if (columns.length == 1) {
				simplify = confirm("Your dataset has only one column. Would you like to simplify it into a one-dimensional array?");
			}
			
			let column_values = row_format; // Used for column-first imports.
			for (let col_i = 0; col_i < columns.length; col_i++) {
				column_values[columns[col_i]] = [];
			}
			for (let i = row_start; i < rows.length; i++) {
				let row = row_format; // Used for row-first imports.
				if (i > row_start && orientation == "row") {
					variable += ",";
				}
				let cells = csv_to_array(rows[i], separator);
				if (cells.length !== columns.length) {
					alert("Error: Your dataset contains rows with differing lengths.");
					return false;
				}
				for (let cell_i = 0; cell_i < cells.length; cell_i++) {
					let cell = isNaN(cells[cell_i]) ? cells[cell_i] : Number(cells[cell_i]); 
					if (orientation == "row") { // Row-first
						if (simplify) {
							row = cell;
						} else {
							row[columns[cell_i]] = cell;
						}
					} else { // Column-first
						column_values[columns[cell_i]].push(cell);
					}
				}
				if (orientation == "row") { // Row-first
					variable += JSON.stringify(row);
				}
			}
			if (orientation == "row") { // Row-first
				variable += "];";
			} else { // Column-first			
				if (simplify) {
					column_values = column_values[columns[0]];
				}
				variable += JSON.stringify(column_values) + ";";
			}
		}
		return variable;
	}
	
	/**
	 * Imports the files and adds them to the workspace.
	 * @param {Object} input - File input object.
	 */
	function import_files(input) {
		let imported = 0;
		
		/**
		 * Increases the number of imported files and reloads the page once called after the last import.
		 * @param {number} id - Handled file's ID.
		 * @param {boolean} status - Import result.
		 */
		function import_callback(id, status) {
			if (status) {
				imported += 1;
			}
			if (id+1 == input.files.length) {
				if (imported > 0) {
					location.reload();
				}
			}
		}
		
		// Handles the files in a loop.
		for (let i = 0; i < input.files.length; i++) {
			let reader = new FileReader();
			reader.onload = (event) => {
				let imported = md_to_file(reader.result, filename);
				import_callback(i, imported);
			}
			let filename = input.files[i].name;
			filename = filename.substring(0, filename.lastIndexOf("."));
			reader.readAsText(input.files[i]);
		}
	}
	
	/**
	 * Imports a workspace.
	 * @param {Object} input - File input object.
	 */
	function import_workspace(input) {
		if (!input.files[0]) {
			return;
		}
		const reader = new FileReader();
		reader.onload = () => {
			let json;
			try {
				json = JSON.parse(reader.result);
				if (json && typeof json === "object") {
					if (("selectedFile" in json) && ("markdownOutputOpen" in json) && ("files" in json) && Object.keys(json["files"]).length > 0) {
						localStorage.setItem("WebPPLEditorState", JSON.stringify(json));
						location.reload();
					} else {
						alert("Error: Invalid data.");
					}
				}
			} catch (e) {
				alert("Error: Invalid JSON.");
			}
		}
		reader.readAsText(input.files[0]);
	}
	
	/**
	 * Imports a dataset.
	 * @param {Object} input - File input object.
	 */
	function import_dataset(input) {
		let imported = 0;
		let dataset_block = "";
		
		/**
		 * Increases the number of imported datasets and sends the import to the dataset modal once it is finished.
		 * @param {number} id - Handled file's ID.
		 * @param {boolean} status - Import result.
		 */
		function import_callback(id, status) {
			if (status) {
				imported += 1;
			}
			if (id+1 == input.files.length) {
				if (imported > 0) {
					// Close the import modal.
					let modal_import = document.getElementById("modal-import");
					modal_import.style.display = "none";
					modal_import.setAttribute("aria-hidden", "true");
					
					// Inject the dataset variable into the dataset modal and open the dataset modal.
					document.getElementById("dataset-text").innerHTML = dataset_block;
					let modal_dataset = document.getElementById("modal-dataset");
					modal_dataset.style.display = "block";
					modal_dataset.setAttribute("aria-hidden", "false");
					
					// Stores whether the last dataset had headers.
					set_cookie("dataset_has_headers", encodeURIComponent(document.getElementById("dataset-has-headers").checked));
					// Stores whether the last dataset used header names.
					set_cookie("dataset_use_headers", encodeURIComponent(document.getElementById("dataset-use-headers").checked));
					// Stores the last used separator in a cookie.
					set_cookie("dataset_separator", encodeURIComponent(document.getElementById("dataset-separator").value));
					// Stores the last used orientation in a cookie.
					set_cookie("dataset_orientation", encodeURIComponent(document.getElementById("dataset-orientation").value));
				}
			}
		}
		
		// Handles the files in a loop. Technically supports multiple files but it is not allowed since each file may require different settings.
		for (let i = 0; i < input.files.length; i++) {
			let reader = new FileReader();
			let has_headers = document.getElementById("dataset-has-headers").checked;
			let use_headers = document.getElementById("dataset-use-headers").checked;
			let separator = document.getElementById("dataset-separator").value;
			let orientation = document.getElementById("dataset-orientation").value;
			reader.onload = (event) => {
				try {
					let imported = dataset_to_variable(reader.result, filename, separator, has_headers, use_headers, orientation);
					dataset_block += imported;
					import_callback(i, imported);
				} catch(err) {
					alert("Dataset could not be parsed. Check for formatting errors.");
				}
			}
			let filename = input.files[i].name;
			reader.readAsText(input.files[i]);
		}
	}
	
	/**
	 * Converts a file from localStorage to MD-formatted string.
	 * @param {string|number} id - File ID in localStorage. If not provided, the selected file is used.
	 * @returns {string} - MD-formatted string.
	 */
	function file_to_md(id=null) {
		let storage = JSON.parse(localStorage.getItem("WebPPLEditorState"));
		id = id || storage["selectedFile"];
		let blocks = storage["files"][id]["blocks"];
		let file = [];
		for (let key in blocks) {
			let content;
			if (blocks[key]["type"] == "code") {
				content = `~~~~\n${blocks[key]["content"]}\n~~~~`;
			} else {
				content = blocks[key]["content"];
			}
			// key denotes the order of insertion while orderingKey denotes the order of display.
			file[blocks[key]["orderingKey"]] = content;
		}
		return file.join("\n\n");
	}
	
	/**
	 * Returns the appropriate import/export button label based on the maximizedness status.
	 * @param {string} btn - A button identifier.
	 * @returns {string} - The button label.
	 */
	function get_btn_label(btn) {
		if (btn != "Import" && btn != "Export") {
			return "";
		} else if (!document.getElementsByClassName("header")[0].classList.contains("maximized")) {
			return btn.toLowerCase();
		} else {
			return `<span class="glyphicon glyphicon-${btn.toLowerCase()}" aria-hidden="true"></span>`;
		}
	}
	
	// Adds the import and export buttons to the page.
	document.getElementsByClassName("maximize")[0].insertAdjacentHTML("beforebegin", `<button class="btn btn-default hidden-xs import" aria-label="Import" id="btn-modal-import" title="Import" data-target="modal-import">${get_btn_label("Import")}</button><button class="btn btn-default hidden-xs" aria-label="Export" id="btn-modal-export" title="Export" data-target="modal-export">${get_btn_label("Export")}</button>`);
	
	// Updates the import and export button labels when the maximize button changes.
	function maximize_callback() {
		document.querySelector("#btn-modal-import").innerHTML = get_btn_label("Import");
		document.querySelector("#btn-modal-export").innerHTML = get_btn_label("Export");
	}
	
	// Observes changes on the maximize button to update the import and export button labels.
	const maximize_observer = new MutationObserver(maximize_callback);
	maximize_observer.observe(document.getElementsByClassName("maximize")[0], { characterData: true, attributes: false, childList: false, subtree: true });
	
	// Fetches the import modal and adds it to the page.
	fetch(chrome.runtime.getURL("modal-import.html"), {headers: {"Content-Type": "text/html"}})
		.then((data) => data.text())
		.then((data_text) => document.getElementsByClassName("panel-default")[0].insertAdjacentHTML("beforebegin", data_text))
		.then(() => modal_import_ready());
		
	// Fetches the import modal and adds it to the page.
	fetch(chrome.runtime.getURL("modal-dataset.html"), {headers: {"Content-Type": "text/html"}})
		.then((data) => data.text())
		.then((data_text) => document.getElementsByClassName("panel-default")[0].insertAdjacentHTML("beforebegin", data_text))
		.then(() => modal_dataset_ready());
	
	// Fetches the export modal and adds it to the page.
	fetch(chrome.runtime.getURL("modal-export.html"), {headers: {"Content-Type": "text/html"}})
		.then((data) => data.text())
		.then((data_text) => document.getElementsByClassName("panel-default")[0].insertAdjacentHTML("beforebegin", data_text))
		.then(() => modal_export_ready());
	
	// Toggles the import modal.
	document.getElementById("btn-modal-import").addEventListener("click", function (event) {
		let modal_import = document.getElementById("modal-import");
		if (modal_import.style.display == "" || modal_import.style.display == "none") {
			modal_import.style.display = "block";
			modal_import.setAttribute("aria-hidden", "false");
		} else {
			modal_import.style.display = "none";
			this.setAttribute("aria-hidden", "true");
		}
	});
	
	// Toggles the export modal.
	document.getElementById("btn-modal-export").addEventListener("click", function (event) {
		let modal_export = document.getElementById("modal-export");
		if (modal_export.style.display == "" || modal_export.style.display == "none") {
			let file_count = Object.keys(JSON.parse(localStorage.getItem("WebPPLEditorState"))["files"]).length;
			let file_count_label;
			if (file_count == 1) {
				file_count_label = file_count + " file";
			} else {
				file_count_label = file_count + " files";
			}
			document.getElementById("workspace-file-count").innerHTML = file_count_label;
			let active_file = document.querySelectorAll("#fileSelector > select")[0].selectedOptions[0].text;
			document.getElementById("export-file-name").value = active_file;
			modal_export.style.display = "block";
			modal_export.setAttribute("aria-hidden", "false");
		} else {
			modal_export.style.display = "none";
			modal_export.setAttribute("aria-hidden", "true");
		}
	});
	
	// Adds some event listeners to the import modal.
	function modal_import_ready() {
		// Closes the modal when clicked on the closing button or outside the modal frame.
		document.getElementById("modal-import").addEventListener("click", function (event) {
			if (!this.getElementsByClassName("modal-dialog")[0].contains(event.target) || this.getElementsByClassName("close")[0].contains(event.target)) {
				this.style.display = "none";
				this.setAttribute("aria-hidden", "true");
			}
		});
		
		// Cleans the textarea if a file is provided.
		document.getElementById("import-file").addEventListener("change", function (event) {
			document.getElementById("import-text").value = "";
		});
		
		// Cleans the file input when the textarea changes.
		document.getElementById("import-text").addEventListener("input", function() {
			document.getElementById("import-file").value = "";
		}, false);
		
		// Imports MD files or the pasted content.
		document.getElementById("btn-import-file").addEventListener("click", function (event) {
			let file_input = document.getElementById("import-file");
			if (file_input.files.length > 0) {
				import_files(file_input);
			} else {
				let text = document.getElementById("import-text").value;
				let imported = md_to_file(text);
				if (imported) {
					location.reload();
				}
			}
		});
		
		// Imports a workspace.
		document.getElementById("btn-import-workspace").addEventListener("click", function (event) {
			import_workspace(document.getElementById("import-workspace"));
		});
		
		// Imports dataset.
		document.getElementById("btn-import-dataset").addEventListener("click", function (event) {
			import_dataset(document.getElementById("import-dataset"));
		});
		
		// Disables using header names when there are no headers.
		document.getElementById("dataset-has-headers").addEventListener("change", function() {
			if (!this.checked) {
				document.getElementById("dataset-use-headers").checked = false;
			} 
		});
		
		// Necessitates having headers when header names are used.
		document.getElementById("dataset-use-headers").addEventListener("change", function() {
			if (this.checked) {
				document.getElementById("dataset-has-headers").checked = true;
			} 
		});
	}
	
	// Adds some event listeners to the dataset modal.
	function modal_dataset_ready() {
		// Remembers the existence of headers.
		let has_headers_cookie = decodeURIComponent(get_cookie("dataset_has_headers"));
		if (has_headers_cookie === "false") {
			document.getElementById("dataset-has-headers").checked = false;
		}
		// Remembers the use of header names.
		let use_headers_cookie = decodeURIComponent(get_cookie("dataset_use_headers"));
		if (use_headers_cookie === "false") {
			document.getElementById("dataset-use-headers").checked = false;
		}
		// Remembers the preferred separator.
		let separator_cookie = decodeURIComponent(get_cookie("dataset_separator"));
		if (separator_cookie) {
			document.getElementById("dataset-separator").value = separator_cookie;
		}
		// Remembers the preferred orientation.
		let orientation_cookie = decodeURIComponent(get_cookie("dataset_orientation"));
		if (orientation_cookie) {
			document.getElementById("dataset-orientation").value = orientation_cookie;
		}
		// Remembers the text-wrap preference.
		let dataset_text_wrap_cookie = decodeURIComponent(get_cookie("dataset_text_wrap"))
		if (dataset_text_wrap_cookie === "false") {
			document.getElementById("dataset-text-wrap").checked = false;
			document.getElementById("dataset-text").style.whiteSpace = "nowrap";
		}
		
		// Changes text wrapping of the imported dataset text based on the checkbox.
		document.getElementById("dataset-text-wrap").addEventListener("change", function() {
			if (this.checked) {
				document.getElementById("dataset-text").style.whiteSpace = "normal";
				set_cookie("dataset_text_wrap", true);
			} else {
				document.getElementById("dataset-text").style.whiteSpace = "nowrap";
				set_cookie("dataset_text_wrap", false);
			}
		});
		
		// Closes the modal when clicked on the closing button or outside the modal frame.
		document.getElementById("modal-dataset").addEventListener("click", function (event) {
			if (!this.getElementsByClassName("modal-dialog")[0].contains(event.target) || this.getElementsByClassName("close")[0].contains(event.target)) {
				this.style.display = "none";
				this.setAttribute("aria-hidden", "true");
			}
		});
		
		// Copies the data variable to the clipboard.
		document.getElementById("btn-copy-dataset").addEventListener("click", function (event) {
			let dataset_text = document.getElementById("dataset-text");
			
			// Copies to clipboard using navigator.clipboard if available. If not, uses the old method.
			if (navigator.clipboard && window.isSecureContext) {
				// WebPPL.org is currently not served over HTTPS, so it does not support navigator.clipboard.
				navigator.clipboard.writeText(dataset_text.value)
			} else {
				// This fallback method is actually deprecated, so it might stop working in the future.
				dataset_text.focus();
				dataset_text.select();
				document.execCommand("copy");
			}
		});
		
		// Inserts the data variable to the current file as a clode block.
		document.getElementById("btn-insert-dataset").addEventListener("click", function (event) {
			let dataset_block = document.getElementById("dataset-text").value;
			let storage = JSON.parse(localStorage.getItem("WebPPLEditorState"));
			let file_id = storage["selectedFile"];
			let blocks = storage["files"][file_id]["blocks"];
			let order;
			if (Object.keys(blocks).length === 0) {
				order = 0;
			} else {
				order = Math.max(...Object.keys(blocks)) + 1;
			}
			storage["files"][file_id]["blocks"][order] = {"type": "code", "content": dataset_block, "orderingKey": order};
			localStorage.setItem("WebPPLEditorState", JSON.stringify(storage))
			location.reload();
		});
	}
	
	// Adds some event listeners to the export modal.
	function modal_export_ready() {
		// Closes the modal when clicked on the closing button or outside the modal frame.
		document.getElementById("modal-export").addEventListener("click", function (event) {
			if (!this.getElementsByClassName("modal-dialog")[0].contains(event.target) || this.getElementsByClassName("close")[0].contains(event.target)) {
				this.style.display = "none";
				this.setAttribute("aria-hidden", "true");
			}
		});
		
		// Exports the active file.
		document.getElementById("btn-export-file").addEventListener("click", function (event) {
			let filename = document.getElementById("export-file-name").value || document.getElementsByTagName("select")[0].selectedOptions[0].text;
			download_file(filename+".md", file_to_md());
			document.getElementById("modal-export").style.display = "none";
		});
		
		// Exports the workspace.
		document.getElementById("btn-export-workspace").addEventListener("click", function (event) {
			let filename = document.getElementById("export-workspace-name").value || "workspace_" + (new Date().getTime());
			download_file(filename+".json", localStorage.getItem("WebPPLEditorState"));
			document.getElementById("modal-export").style.display = "none";
		});
	}
}