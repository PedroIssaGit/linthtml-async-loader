## linthtml-async-loader

Yet another [linthtml](https://github.com/linthtml/linthtml) loader. Tested with [webpack@3](https://github.com/webpack/webpack).

- Like [robbiedigital/linthtml-loader](https://github.com/robbiedigital/linthtml-loader) but without [deasync](https://github.com/abbr/deasync) usage.
- Like [GideonPARANOID/linthtml-loader](https://github.com/GideonPARANOID/linthtml-loader) but with better output formatting.

```
yarn -D linthtml-async-loader
```

```javascript
module.exports = {
  module: {
    rules: [{
      test: /\.(html|ejs)$/),
      enforce: 'pre',
      loader: 'linthtml-async-loader',
      options: {
        config: '.linthtmlrc',
        failOnProblem: false
      }
    }]
  }
}
```

![image](https://user-images.githubusercontent.com/6743076/42134605-e4da7756-7d47-11e8-8f63-ac466172e7dc.png)
