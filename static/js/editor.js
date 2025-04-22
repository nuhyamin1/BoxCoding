class EditorManager {
    constructor() {
        this.editors = {};
        this.initialized = false;
        this.initializeMonaco();
    }

    initializeMonaco() {
        require.config({ paths: { 'vs': 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.34.1/min/vs' } });
        require(['vs/editor/editor.main'], () => {
            this.initialized = true;
            this.createPendingEditors();
        });
    }

    createPendingEditors() {
        if (!this.initialized) return;
        
        // Create any pending editors
        for (const [id, options] of Object.entries(this.editors)) {
            if (!options.instance) {
                this.createEditor(id, options.element, options.language, options.value);
            }
        }
    }

    createEditor(id, element, language = 'python', value = '') {
        if (!this.initialized) {
            // Store request for later when Monaco is ready
            this.editors[id] = { element, language, value, instance: null };
            return null;
        }

        const editor = monaco.editor.create(element, {
            value: value,
            language: language,
            theme: 'vs',
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            automaticLayout: true,
            lineNumbers: 'on',
            folding: true,
            fontSize: 14,
            renderLineHighlight: 'all'
        });

        this.editors[id] = { element, language, value, instance: editor };
        return editor;
    }

    getEditor(id) {
        return this.editors[id]?.instance || null;
    }

    getValue(id) {
        const editor = this.getEditor(id);
        return editor ? editor.getValue() : '';
    }

    setValue(id, value) {
        const editor = this.getEditor(id);
        if (editor) {
            editor.setValue(value);
        }
    }

    removeEditor(id) {
        const editor = this.getEditor(id);
        if (editor) {
            editor.dispose();
            delete this.editors[id];
        }
    }

    resizeEditor(id) {
        const editor = this.getEditor(id);
        if (editor) {
            editor.layout();
        }
    }
}