function getVersionKey({ version, commit, commitDate }) {
  return commit ? `${version} (${commit.slice(0, 7)}, ${commitDate})` : version
}

// Fetch the perf.jsonl file in the same directory
fetch('./perf.jsonl')
  .then((response) => response.text())
  .then((text) => {
    // Split file contents by newline and parse each line as JSON
    const lines = text.trim().split('\n')
    const rawData = lines.map(line => JSON.parse(line))
    
    // Extract unique versions
    const versions = [...new Set(rawData.map(d => JSON.stringify({ commitDate: d.commitDate, version: d.version, commit: d.commit })))]
      .map(str => JSON.parse(str))
      .sort((a, b) => new Date(a.commitDate) - new Date(b.commitDate))
      .map(getVersionKey)
    console.log('Versions found in perf.jsonl:', versions)
    
    // Extract unique test names
    const testNames = [...new Set(rawData.map(d => d.name))]

    // Create a lookup: { name: { version: ms } }
    const lookup = {}
    rawData.forEach(item => {
      const { name, version, commit, commitDate, ms } = item
      const versionKey = getVersionKey({ version, commit, commitDate })
      if (!lookup[name]) {
        lookup[name] = {}
      }
      lookup[name][versionKey] = ms
    })

    // Deterministic color function for the "rainbow" scale
    function getDeterministicColor(index) {
      const hue = index * (360 / testNames.length)
      return `hsl(${hue}, 70%, 50%)`
    }

    // Build datasets for Chart.js using deterministic colors
    const datasets = testNames.map((name, index) => ({
      label: name,
      data: versions.map(version => lookup[name][version] ?? null),
      borderColor: getDeterministicColor(index),
      fill: false
    }))

    // Render the chart
    const ctx = document.getElementById('benchmarkChart').getContext('2d')
    new Chart(ctx, {
      type: 'line',
      data: {
        labels: versions,
        datasets: datasets,
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            type: 'logarithmic',
            title: {
              display: true,
              text: 'Time (ms)',
            },
          },
          x: {
            title: {
              display: true,
              text: 'Version',
            },
          },
        },
        plugins: {
          title: {
            display: true,
            text: 'Benchmark Results',
          },
          legend: {
            position: 'bottom',
          },
        },
      }
    })
  })
  .catch(error => {
    console.error('Error loading or parsing perf.jsonl:', error)
  })
