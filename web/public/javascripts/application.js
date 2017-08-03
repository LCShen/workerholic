var App = {
  queuedJobsCountHistory: [],
  failedJobsCountHistory: [],
  jobsCompletedHistory: [],
  jobsCompletedPerSecondHistory: [],
  totalMemoryHistory: [],
  maxTime: 180,
  freshDataCount: function() {
    return (this.maxTime / 5) + 1;
  },
  tab: null,
  removeStaleData: function() {
    if (this.queuedJobsCountHistory.length > this.freshDataCount) {
      this.queuedJobsCountHistory.pop();
      this.failedJobsCountHistory.pop();
      this.jobsCompletedHistory.pop();
      this.totalMemoryHistory.pop();
    }
  },
  getOverviewData: function() {
    $.ajax({
      url: '/overview-data',
      context: this,
      success: function(data) {
        var deserializedData = JSON.parse(data);
        var workersCount = deserializedData.workers_count;
        var scheduledJobsCount = deserializedData.scheduled_jobs;

        var completedJobs = deserializedData.completed_jobs.reduce(function(sum, subArray) {
          return sum + subArray[1];
        }, 0);

        var failedJobsCount= deserializedData.failed_jobs.reduce(function(sum, subArray) {
          return sum + subArray[1];
        }, 0);

        var queuedJobs = deserializedData.queued_jobs;

        var queuedJobsCount = queuedJobs.reduce(function(sum, queue) {
          return sum + queue[1];
        }, 0);

        var memoryUsage = deserializedData.memory_usage;
        var totalMemoryUsage = 0;

        for (id in memoryUsage) {
          totalMemoryUsage = totalMemoryUsage + parseInt(memoryUsage[id]);
          // if ($('#process_' + id).length === 1) {
          $('#process_' + id).text(parseInt(memoryUsage[id]) / 1000 + ' MB');
          // } else {
          //   $('.nested').last().after("<tr class='nested'><td>" + id + "</td><td id='process_'" + id + ">" + memoryUsage[id] + "</td></tr>")
          // }
        }

        this.queuedJobsCountHistory.unshift(queuedJobsCount);
        this.failedJobsCountHistory.unshift(failedJobsCount);
        this.jobsCompletedHistory.unshift(completedJobs);
        this.totalMemoryHistory.unshift(totalMemoryUsage / 1000);
        this.jobsCompletedPerSecondHistory.unshift((this.jobsCompletedHistory[0] - this.jobsCompletedHistory[1]) / 5 || 0);

        this.removeStaleData();
        this.drawChart();

        $('.completed_jobs').text(completedJobs);
        $('.failed_jobs').text(failedJobsCount);
        $('.queue_count').text(queuedJobs.length);
        $('.queued_jobs_count').text(queuedJobsCount);
        $('.scheduled_jobs').text(scheduledJobsCount);
        $('.workers_count').text(workersCount);
        $('.memory_usage').text(totalMemoryUsage / 1000 + ' MB');
      }
    });
  },
  getQueueData: function() {
    $.ajax({
      url: '/queues-data',
      success: function(data) {
        var deserializedData = JSON.parse(data);
        var queuedJobs = deserializedData.queued_jobs;
        var total = 0;

        for (var i = 0; i < queuedJobs.length; i++) {
          $('#queue_name_' + queuedJobs[i][0].split(':').pop()).text(queuedJobs[i][0]);
          $('#queue_count_' + queuedJobs[i][0].split(':').pop()).text(queuedJobs[i][1]);
          total = total + queuedJobs[i][1];
        }

        $('#queue_total').text(total);
      }
    });
  },
  getDetailData: function() {
    $.ajax({
      url: '/details-data',
      success: function(data) {
        var deserializedData = JSON.parse(data);
        var completedJobs = deserializedData.completed_jobs;
        var failedJobs = deserializedData.failed_jobs;
        var completedTotal = 0;
        var failedTotal = 0;

        completedJobs.forEach(function(job) {
          $('#completed_' + job[0]).text(job[1]);
          completedTotal = completedTotal + job[1];
        });

        failedJobs.forEach(function(job) {
          $('#failed_' + job[0]).text(job[1]);
          failedTotal = failedTotal + job[1];
        });

        $('#failed_total').text(failedTotal);
        $('#completed_total').text(completedTotal);
      }
    })
  },
  getHistoryData: function() {
    var days = parseInt($(location).attr('href').match(/\d*$/)[0]) || 7;
    $('#button_' + days).addClass('is-dark');
    this.drawHistoryChart(days);

    $('#class_selector').on('change', function(e) {
      window.location = location + '&' + 'class=' + e.target.value;
    });
  },
  drawChart: function() {
    var processedJobsChart = new CanvasJS.Chart('jobs_processed_container', {
      title: {
        text: 'Jobs Processed per second',
        fontFamily: 'Arial',
        fontSize: 24,
      },
      axisX: {
        reversed: true,
        gridColor: 'Silver',
        tickColor: 'silver',
        animationEnabled: true,
        title: 'Time ago (s)',
        maximum: this.maxTime
      },
      toolTip: {
        shared: true
      },
      theme: "theme2",
      axisY: {
        gridColor: "Silver",
        tickColor: "silver",
        title: 'Jobs per second',
      },
      data: [{
        type: "line",
        showInLegend: true,
        name: "Jobs completed",
        color: "blue",
        markerType: 'circle',
        lineThickness: 2,
        dataPoints: this.setDataPoints(this.jobsCompletedPerSecondHistory, this.freshDataCount()),
      }]
    });

    var queuedJobsChart = new CanvasJS.Chart('queued_jobs_container', {
      title: {
        text: 'Queued Jobs',
        fontFamily: 'Arial',
        fontSize: 24,
      },
      axisX: {
        reversed: true,
        gridColor: 'Silver',
        tickColor: 'silver',
        animationEnabled: true,
        title: 'Time ago (s)',
        // minimum: 0,
        maximum: this.maxTime,
      },
      toolTip: {
        shared: true
      },
      theme: "theme2",
      axisY: {
        gridColor: "Silver",
        tickColor: "silver",
        title: 'Jobs'
      },
      data: [{
        type: "line",
        showInLegend: true,
        lineThickness: 2,
        name: "Queued Jobs",
        markerType: "circle",
        color: "#F08080",
        dataPoints: this.setDataPoints(this.queuedJobsCountHistory, this.freshDataCount()),
      }],
    });

    var failedJobsChart = new CanvasJS.Chart('failed_jobs_container', {
      title: {
        text: 'Failed Jobs',
        fontFamily: 'Arial',
        fontSize: 24,
      },
      axisX: {
        reversed: true,
        gridColor: 'Silver',
        tickColor: 'silver',
        animationEnabled: true,
        title: 'Time ago (s)',
        // minimum: 0,
        maximum: this.maxTime,
      },
      toolTip: {
        shared: true
      },
      theme: "theme2",
      axisY: {
        gridColor: "Silver",
        tickColor: "silver",
        title: 'Jobs'
      },
      data: [{
          type: "line",
          showInLegend: true,
          name: "Failed Jobs",
          color: "#20B2AA",
          markerType: 'circle',
          lineThickness: 2,
          dataPoints: this.setDataPoints(this.failedJobsCountHistory, this.freshDataCount()),
        },
      ]
    });

    var totalMemoryChart = new CanvasJS.Chart('total_memory_container', {
      title: {
        text: 'Memory Usage',
        fontFamily: 'Arial',
        fontSize: 24,
      },
      axisX: {
        reversed: true,
        gridColor: 'Silver',
        tickColor: 'silver',
        animationEnabled: true,
        title: 'Time ago (s)',
        // minimum: 0,
        maximum: this.maxTime
      },
      toolTip: {
        shared: true
      },
      theme: "theme2",
      axisY: {
        gridColor: "Silver",
        tickColor: "silver",
        title: 'Memory (mb)'
      },
      data: [{
        type: "line",
        showInLegend: true,
        name: "Memory usage",
        color: "#20B2AA",
        markerType: 'circle',
        lineThickness: 2,
        dataPoints: this.setDataPoints(this.totalMemoryHistory, this.freshDataCount()),
      }],
    });

    queuedJobsChart.render();
    failedJobsChart.render();
    processedJobsChart.render();
    totalMemoryChart.render();
  },
  drawHistoryChart: function(days) {
    var completedHistoryChart = new CanvasJS.Chart('history_container_completed', {
      title: {
        text: 'Completed History for ' + days + ' days',
        fontFamily: 'Arial',
        fontSize: 24,
      },
      axisX: {
        reversed: true,
        gridColor: 'Silver',
        tickColor: 'silver',
        animationEnabled: true,
        title: 'Time ago (s)',
        // minimum: 0,
        maximum: days,
      },
      toolTip: {
        shared: true
      },
      theme: "theme2",
      axisY: {
        gridColor: "Silver",
        tickColor: "silver",
        title: 'Jobs'
      },
      data: [{
        type: "line",
        showInLegend: true,
        name: "Failed Jobs",
        color: "#20B2AA",
        markerType: 'circle',
        lineThickness: 2,
        dataPoints: [],
      }],
    });

    var failedHistoryChart = new CanvasJS.Chart('history_container_failed', {
      title: {
        text: 'Failed History for ' + days + ' days',
        fontFamily: 'Arial',
        fontSize: 24,
      },
      axisX: {
        reversed: true,
        gridColor: 'Silver',
        tickColor: 'silver',
        animationEnabled: true,
        title: 'Time ago (s)',
        // minimum: 0,
        maximum: days,
      },
      toolTip: {
        shared: true
      },
      theme: "theme2",
      axisY: {
        gridColor: "Silver",
        tickColor: "silver",
        title: 'Jobs'
      },
      data: [{
        type: "line",
        showInLegend: true,
        name: "Failed Jobs",
        color: "#20B2AA",
        markerType: 'circle',
        lineThickness: 2,
        dataPoints: [],
      }],
    });

    completedHistoryChart.render();
    failedHistoryChart.render();
  },
  setDataPoints: function(array, count) {
    var data = [];

    for (var i = 0; i <= count; i++) {
      var point = { x: (i * 5).toString(), y: array[i] };
      data.push(point);
    }

    return data;
  },
  setActiveTab: function() {
    this.tab = $(location).attr('href').match(/(?:(?!\?).)*/)[0].split('/').pop();
    var $active = $('a[href=' + this.tab + ']');

    $active.css('background', '#a2a2a2');
    $active.css('color', '#fff');
  },
  pollData: function(tab) {
    if (tab === 'overview') {
      this.getOverviewData();

      setInterval(function() {
        this.getOverviewData();
      }.bind(this), 5000);
    }

    if (tab === 'queues') {
      setInterval(function() {
        this.getQueueData();
      }.bind(this), 5000);
    }

    if (tab === 'details') {
      setInterval(function() {
        this.getDetailData();
      }.bind(this), 5000);
    }

    if (tab === 'history') {
      this.getHistoryData();
    }
  },
  bindEvents: function() {
    $('#memory_usage').on('click', function(e) {
      $('.nested th').toggle();
      $('.nested td').toggle();
    });
  },
  init: function() {
    this.setActiveTab();
    this.bindEvents();
    this.pollData(this.tab);
  }
}

$(document).ready(App.init.bind(App));
