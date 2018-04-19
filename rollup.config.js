import babel from 'rollup-plugin-babel';

export default {
    input: 'src/index.js',
    output: {
        file: 'build/d3-curve-editor.js',
        sourcemap: true,
        name: 'D3CE',
        format: 'umd'
    },
    plugins: [babel({
        presets: [
            [
                'es2015', {
                    'modules': false
                }
            ]
        ],
        plugins: ['external-helpers']
    })
    ]
};