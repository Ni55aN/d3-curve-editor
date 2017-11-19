import babel from 'rollup-plugin-babel';

export default {
    entry: 'src/index.js',
    dest: 'build/d3-curve-editor.js',
    sourceMap: true,
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
    ],
    format: 'umd',
    moduleName: 'D3CE'
};