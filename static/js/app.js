document.addEventListener('DOMContentLoaded', () => {
    const editorManager = new EditorManager();
    let projectData = []; // Holds the hierarchical data for boxes
    let nextId = 1; // Simple ID generator

    const boxesContainer = d3.select("#boxes-container");

    // --- D3 Rendering ---

    function update() {
        const topLevelBoxes = projectData.filter(d => !d.parentId); // Only render top-level (files)

        const boxSelection = boxesContainer.selectAll(".code-box.file-box") // Select only top-level file boxes
            .data(topLevelBoxes, d => d.id);

        // Exit
        boxSelection.exit()
            .each(d => {
                // Clean up editors associated with the removed box and its children
                const descendants = getAllDescendants(d.id);
                descendants.forEach(desc => editorManager.removeEditor(desc.id));
                editorManager.removeEditor(d.id);
            })
            .remove();

        // Enter
        const boxEnter = boxSelection.enter()
            .append("div")
            .attr("class", d => `code-box file-box ${d.type}-box`) // Add file-box class
            .attr("data-id", d => d.id);

        // Header
        const headerEnter = boxEnter.append("div")
            .attr("class", "box-header")
            .on("click", (event, d) => {
                // Don't toggle if click was on button or input
                if (event.target.closest('button, input, .editable-title input')) {
                    return;
                }
                toggleExpand(event, d);
            });

        headerEnter.append("span")
            .attr("class", "editable-title")
            .text(d => d.title)
            .on("dblclick", (event, d) => editTitle(event, d));

        const headerButtons = headerEnter.append("div")
             .attr("class", "header-buttons");

        // Add child button (Class for File, Method for Class)
        headerButtons.filter(d => d.type === 'file' || d.type === 'class')
            .append("button")
            .attr("class", "add-child-btn")
            .attr("title", d => d.type === 'file' ? "Add Class" : "Add Method") // Tooltip
            .html('<i class="fas fa-plus"></i>') // Icon
            .on("click", (event, d) => addChildBox(event, d));

        // Copy button
        headerButtons.append("button")
            .attr("class", "copy-btn")
            .attr("title", "Copy Code") // Tooltip
            .html('<i class="fas fa-copy"></i>') // Icon
            .on("click", (event, d) => copyCode(event, d));

        // Delete button
        headerButtons.append("button")
            .attr("class", "delete-btn")
            .attr("title", "Delete Box") // Tooltip
            .html('<i class="fas fa-trash-alt"></i>') // Icon
            .on("click", (event, d) => deleteBox(event, d));

        // Editor container
        boxEnter.append("div")
            .attr("class", "editor-container")
            .style("max-height", "0px") // Start collapsed
            .style("overflow", "hidden");

        // Children container
        boxEnter.append("div")
            .attr("class", "children-container");

        // Merge + Update
        const boxUpdate = boxEnter.merge(boxSelection);

        boxUpdate.select(".editable-title")
            .text(d => d.title); // Update title if changed externally (e.g., load)

        // Update children recursively
        boxUpdate.each(function(d) {
            renderChildren(d3.select(this).select(".children-container"), d.id);
        });

        // Apply expanded state
        boxUpdate.classed("expanded", d => d.expanded);
        boxUpdate.select(".editor-container")
            .style("max-height", d => d.expanded ? "300px" : "0px") // Adjust height based on state
            .each(function(d) {
                if (d.expanded) {
                    const editorContainer = this;
                    // Ensure editor exists only when expanded
                    if (!editorManager.getEditor(d.id)) {
                        setTimeout(() => { // Allow container to resize first
                           const editor = editorManager.createEditor(d.id, editorContainer, 'python', d.code || '');
                           if (editor) {
                               // Optional: Focus editor on expand
                               // editor.focus();
                           }
                        }, 50); // Small delay
                    } else {
                         // If editor already exists, ensure layout is updated
                         setTimeout(() => editorManager.resizeEditor(d.id), 50);
                    }
                } else {
                    // Optional: Could destroy editor instance on collapse to save resources
                    // editorManager.removeEditor(d.id);
                    // Or just keep it, depends on performance needs
                }
            });
    }

    function renderChildren(container, parentId) {
        const childrenData = projectData.filter(d => d.parentId === parentId);

        const childBoxSelection = container.selectAll(".code-box")
            .data(childrenData, d => d.id);

        // Exit
        childBoxSelection.exit()
             .each(d => {
                // Clean up editors associated with the removed box and its children
                const descendants = getAllDescendants(d.id);
                descendants.forEach(desc => editorManager.removeEditor(desc.id));
                editorManager.removeEditor(d.id);
            })
            .remove();

        // Enter
        const childBoxEnter = childBoxSelection.enter()
            .append("div")
            .attr("class", d => `code-box ${d.type}-box`)
            .attr("data-id", d => d.id);

        // Header
        const childHeaderEnter = childBoxEnter.append("div")
            .attr("class", "box-header")
             .on("click", (event, d) => {
                if (event.target.closest('button, input, .editable-title input')) {
                    return;
                }
                toggleExpand(event, d);
            });

        childHeaderEnter.append("span")
            .attr("class", "editable-title")
            .text(d => d.title)
            .on("dblclick", (event, d) => editTitle(event, d));

        const childHeaderButtons = childHeaderEnter.append("div")
             .attr("class", "header-buttons");

        // Add child button (Method for Class)
        childHeaderButtons.filter(d => d.type === 'class')
            .append("button")
            .attr("class", "add-child-btn")
            .attr("title", "Add Method") // Tooltip
            .html('<i class="fas fa-plus"></i>') // Icon
            .on("click", (event, d) => addChildBox(event, d));

        // Copy button
        childHeaderButtons.append("button")
            .attr("class", "copy-btn")
            .attr("title", "Copy Code") // Tooltip
            .html('<i class="fas fa-copy"></i>') // Icon
            .on("click", (event, d) => copyCode(event, d));

        // Delete button
        childHeaderButtons.append("button")
            .attr("class", "delete-btn")
            .attr("title", "Delete Box") // Tooltip
            .html('<i class="fas fa-trash-alt"></i>') // Icon
            .on("click", (event, d) => deleteBox(event, d));

        // Editor container
        childBoxEnter.append("div")
            .attr("class", "editor-container")
            .style("max-height", "0px")
            .style("overflow", "hidden");

        // Children container (for potential future nesting, e.g., functions within methods?)
        childBoxEnter.append("div")
            .attr("class", "children-container");

        // Merge + Update
        const childBoxUpdate = childBoxEnter.merge(childBoxSelection);

        childBoxUpdate.select(".editable-title")
            .text(d => d.title);

        // Recursively render grandchildren if the box type allows children (e.g., class)
        childBoxUpdate.filter(d => d.type === 'class').each(function(d) {
            renderChildren(d3.select(this).select(".children-container"), d.id);
        });

         // Apply expanded state
        childBoxUpdate.classed("expanded", d => d.expanded);
        childBoxUpdate.select(".editor-container")
            .style("max-height", d => d.expanded ? "300px" : "0px") // Adjust height
             .each(function(d) {
                if (d.expanded) {
                    const editorContainer = this;
                    if (!editorManager.getEditor(d.id)) {
                         setTimeout(() => {
                           const editor = editorManager.createEditor(d.id, editorContainer, 'python', d.code || '');
                           if (editor) {
                               // editor.focus();
                           }
                        }, 50);
                    } else {
                         setTimeout(() => editorManager.resizeEditor(d.id), 50);
                    }
                }
            });
    }

    // --- Box Actions ---

    function getNewId() {
        return nextId++;
    }

    function addFileBox() {
        const fileName = prompt("Enter file name (e.g., main.py):");
        if (fileName) {
            projectData.push({
                id: getNewId(),
                title: fileName,
                type: 'file',
                code: `# File: ${fileName}\n`,
                expanded: false,
                parentId: null // Top-level
            });
            update();
        }
    }

    function addChildBox(event, parentData) {
        event.stopPropagation(); // Prevent toggleExpand on button click
        const childType = parentData.type === 'file' ? 'class' : 'method';
        const promptText = childType === 'class' ? "Enter class name:" : "Enter method name (e.g., my_method or __init__):";
        const childName = prompt(promptText);

        if (childName) {
            let initialCode = '';
            if (childType === 'class') {
                initialCode = `class ${childName}:\n    pass\n`;
            } else { // method
                const params = childName === '__init__' ? 'self, ' : 'self';
                initialCode = `def ${childName}(${params}):\n    pass\n`;
            }

            projectData.push({
                id: getNewId(),
                title: childName,
                type: childType,
                code: initialCode,
                expanded: false,
                parentId: parentData.id
            });
            // Ensure parent is expanded to show the new child
            parentData.expanded = true;
            update();
        }
    }

    function deleteBox(event, boxData) {
        event.stopPropagation();
        if (confirm(`Are you sure you want to delete '${boxData.title}' and all its contents?`)) {
            const idsToDelete = [boxData.id, ...getAllDescendants(boxData.id).map(d => d.id)];
            projectData = projectData.filter(d => !idsToDelete.includes(d.id));
            update();
        }
    }

     function editTitle(event, boxData) {
        event.stopPropagation();
        const titleElement = d3.select(event.currentTarget);
        const currentTitle = boxData.title;

        // Replace span with input
        const parent = d3.select(titleElement.node().parentNode);
        titleElement.style("display", "none"); // Hide original span

        const input = parent.insert("input", ".header-buttons") // Insert input before buttons
            .attr("type", "text")
            .attr("value", currentTitle)
            .attr("class", "title-edit-input")
            .on("blur", handleBlur)
            .on("keydown", handleKeydown);

        input.node().focus();
        input.node().select();

        function handleBlur() {
            finishEdit(input.node().value);
        }

        function handleKeydown(e) {
            if (e.key === "Enter") {
                finishEdit(input.node().value);
            } else if (e.key === "Escape") {
                finishEdit(currentTitle); // Revert on Escape
            }
        }

        function finishEdit(newTitle) {
            input.remove(); // Remove input field
            titleElement.style("display", null); // Show original span again

            if (newTitle && newTitle !== currentTitle) {
                boxData.title = newTitle;
                titleElement.text(newTitle); // Update span text immediately
                // No need to call update() just for title change unless structure depends on it
            }
        }
    }

    function toggleExpand(event, boxData) {
         // Don't expand/collapse if clicking on the editable title itself during edit
        if (event.target.classList.contains('title-edit-input')) {
            return;
        }
        boxData.expanded = !boxData.expanded;
        update(); // Re-render to apply changes
    }

    function copyCode(event, boxData) {
        event.stopPropagation(); // Prevent toggleExpand
        const editor = editorManager.getEditor(boxData.id);
        const codeToCopy = editor ? editor.getValue() : (boxData.code || '');

        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(codeToCopy).then(() => {
                // Provide feedback using icon
                const button = d3.select(event.currentTarget); // Use d3 selection
                const originalIconHTML = button.html(); // Store original icon
                button.html('<i class="fas fa-check"></i>'); // Show checkmark
                button.property("disabled", true);
                setTimeout(() => {
                    button.html(originalIconHTML); // Restore original icon
                    button.property("disabled", false);
                }, 1500); // Revert after 1.5 seconds
            }).catch(err => {
                console.error('Failed to copy code: ', err);
                alert('Failed to copy code to clipboard.');
            });
        } else {
            // Fallback for older browsers (less common now)
            alert('Clipboard API not available in this browser.');
        }
    }

    function getAllDescendants(parentId) {
        let descendants = [];
        const children = projectData.filter(d => d.parentId === parentId);
        descendants = descendants.concat(children);
        children.forEach(child => {
            descendants = descendants.concat(getAllDescendants(child.id));
        });
        return descendants;
    }

    // --- Data Persistence & Generation ---

    function getProjectStructure() {
        // Update code content from editors before saving/generating
        projectData.forEach(box => {
            const editor = editorManager.getEditor(box.id);
            if (editor) {
                box.code = editor.getValue();
            }
        });

        // Build the hierarchical structure expected by PyQt version's get_data
        const buildHierarchy = (parentId) => {
            return projectData
                .filter(box => box.parentId === parentId)
                .map(box => ({
                    id: box.id, // Keep id for potential future use
                    title: box.title,
                    type: box.type,
                    code: box.code || '',
                    children: buildHierarchy(box.id) // Recursive call
                }));
        };
        return buildHierarchy(null); // Start with top-level boxes (parentId is null)
    }

    function saveProject() {
        const projectName = prompt("Enter project name to save:", "my_project");
        if (!projectName) return;

        const structuredData = getProjectStructure();

        fetch('/api/save', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: projectName, data: structuredData })
        })
        .then(response => response.json())
        .then(result => {
            if (result.success) {
                alert(result.message);
            } else {
                alert(`Error: ${result.message}`);
            }
        })
        .catch(error => alert(`Network error: ${error}`));
    }

    function loadProject(filename) {
        fetch('/api/load', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ filename: filename })
        })
        .then(response => response.json())
        .then(result => {
            if (result.success) {
                // Clear existing editors and data
                projectData.forEach(box => editorManager.removeEditor(box.id));
                projectData = [];
                nextId = 1; // Reset ID counter

                // Flatten the loaded hierarchical data and assign new IDs
                const flattenData = (nodes, parentId = null) => {
                    let flatList = [];
                    nodes.forEach(node => {
                        const newId = getNewId();
                        flatList.push({
                            id: newId,
                            title: node.title,
                            type: node.type,
                            code: node.code,
                            expanded: false, // Start collapsed
                            parentId: parentId
                        });
                        if (node.children && node.children.length > 0) {
                            flatList = flatList.concat(flattenData(node.children, newId));
                        }
                    });
                    return flatList;
                };

                projectData = flattenData(result.data);
                update(); // Render the loaded project
                closeModal('project-modal');
                alert(`Project '${filename}' loaded.`);
            } else {
                alert(`Error loading project: ${result.message}`);
            }
        })
        .catch(error => alert(`Network error: ${error}`));
    }

    function showLoadModal() {
        fetch('/api/projects')
            .then(response => response.json())
            .then(result => {
                if (result.success) {
                    const projectsList = d3.select("#projects-list");
                    projectsList.html(''); // Clear previous list
                    if (result.projects.length === 0) {
                        projectsList.append('p').text('No saved projects found.');
                    } else {
                        result.projects.forEach(filename => {
                            projectsList.append('button')
                                .text(filename)
                                .on('click', () => loadProject(filename));
                        });
                    }
                    openModal('project-modal');
                } else {
                    alert(`Error listing projects: ${result.message}`);
                }
            })
            .catch(error => alert(`Network error: ${error}`));
    }

    // Client-side code generation (similar to PyQt version)
    function generateCodeInternal(boxId, indentLevel = 0) {
        const box = projectData.find(b => b.id === boxId);
        if (!box) return "";

        const baseIndentStr = " ".repeat(indentLevel * 4);
        const editor = editorManager.getEditor(box.id);
        const currentCode = editor ? editor.getValue() : (box.code || '');

        // Format current box's code
        const formattedCodeLines = currentCode.split('\n').map(line => {
            return line.trim() ? baseIndentStr + line : "";
        });
        let finalCode = formattedCodeLines.join('\n');

        // Generate code for children
        const children = projectData.filter(b => b.parentId === boxId);
        let childCodeParts = [];
        let nextLevelForChildren = indentLevel + 1;
        if (box.type === 'file') {
            nextLevelForChildren = 0; // Classes/functions in files start at level 0
        }

        if (box.type === 'file' || box.type === 'class') {
             childCodeParts = children.map(child => generateCodeInternal(child.id, nextLevelForChildren));
        }

        const joinSeparator = (box.type === 'class') ? "\n" : "\n\n";
        const childCode = childCodeParts.filter(Boolean).join(joinSeparator);


        // Combine current code and children's code
        if (childCode.trim()) {
             if (box.type === 'class') {
                // Attempt to replace 'pass'
                const passIndentStr = " ".repeat((indentLevel + 1) * 4);
                const passPattern = new RegExp(`^${passIndentStr}pass\\s*$`, 'm'); // Multiline match for pass at correct indent
                if (passPattern.test(finalCode)) {
                    finalCode = finalCode.replace(passPattern, childCode);
                } else {
                    // Append if pass not found or replaced
                    finalCode += (finalCode.trim() ? "\n" : "") + childCode;
                }
            } else { // For files, append children
                finalCode += (finalCode.trim() ? "\n\n" : "") + childCode;
            }
        }

        return finalCode;
    }


    function generateCode() {
        const structuredData = getProjectStructure(); // Ensure code is up-to-date
        let allGeneratedCode = "";

        structuredData.forEach(fileBox => {
             allGeneratedCode += `# --- Code for ${fileBox.title} ---\n`;
             // Use the client-side generator with the correct starting ID
             const fileRoot = projectData.find(b => b.title === fileBox.title && b.type === 'file' && !b.parentId);
             if(fileRoot) {
                 allGeneratedCode += generateCodeInternal(fileRoot.id, 0);
             }
             allGeneratedCode += `\n# --- End of ${fileBox.title} ---\n\n`;
        });


        const codeContainer = document.getElementById('generated-code-container');
        codeContainer.innerHTML = ''; // Clear previous
        // Use a pre tag for better formatting display
        const pre = document.createElement('pre');
        const code = document.createElement('code');
        code.textContent = allGeneratedCode.trim();
        pre.appendChild(code);
        codeContainer.appendChild(pre);

        // Optional: Add syntax highlighting to the generated code display if needed
        // You might need a library like highlight.js for this static display

        openModal('code-modal');
    }

    function saveGeneratedCodeToFile() {
        const codeContent = document.querySelector('#generated-code-container code').textContent;
        const blob = new Blob([codeContent], { type: 'text/plain;charset=utf-8' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'generated_code.py'; // Default filename
        link.click();
        URL.revokeObjectURL(link.href);
    }


    // --- Modal Handling ---
    function openModal(modalId) {
        document.getElementById(modalId).style.display = 'block';
    }

    function closeModal(modalId) {
        document.getElementById(modalId).style.display = 'none';
    }

    // --- Event Listeners ---
    document.getElementById('add-file').addEventListener('click', addFileBox);
    document.getElementById('save-project').addEventListener('click', saveProject);
    document.getElementById('load-project').addEventListener('click', showLoadModal);
    document.getElementById('generate-code').addEventListener('click', generateCode);
    document.getElementById('save-generated-code').addEventListener('click', saveGeneratedCodeToFile);


    // Close modals when clicking the 'x'
    document.querySelectorAll('.modal .close').forEach(span => {
        span.addEventListener('click', (e) => {
            closeModal(e.target.closest('.modal').id);
        });
    });

    // Close modals when clicking outside the content
    window.addEventListener('click', (event) => {
        if (event.target.classList.contains('modal')) {
            closeModal(event.target.id);
        }
    });

    // --- Initial Load ---
    update(); // Initial render (empty)

});
