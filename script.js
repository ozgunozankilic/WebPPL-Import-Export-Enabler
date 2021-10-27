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
					let code = content.substring(tilde_starts[i]+4, tilde_starts[i+1]).trim();
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
						alert("Invalid data.");
					}
				}
			} catch (e) {
				alert("Invalid JSON.");
			}
		}
		reader.readAsText(input.files[0]);
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
			let active_file = document.getElementsByTagName("select")[0].selectedOptions[0].text;
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