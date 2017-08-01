require 'sinatra/base'

# require 'sinatra/reloader'
require 'json'
require 'workerholic'

class WorkerholicWeb < Sinatra::Base

  get '/' do
    redirect '/overview'
  end

  get '/overview' do
    erb :index
  end

  get '/details' do
    completed_jobs = Workerholic::StatsAPI.job_statistics( {category: 'completed_jobs', count_only: true} )
    failed_jobs = Workerholic::StatsAPI.job_statistics( {category: 'failed_jobs', count_only: true} )

    @job_stats = {}
    @completed_total = 0
    @failed_total = 0

    completed_jobs.each do |job|
      @job_stats[job[0]] = { completed: job[1] }
      @completed_total += job[1]
    end

    failed_jobs.each do |job|
      @job_stats[job[0]].merge( { failed: job[1] })
      @failed_total += job[1]
    end

    erb :details
  end

  get '/queues' do
    @queues = Workerholic::StatsAPI.queued_jobs
    @total = 0
    @queues.each do |queue|
      @total += queue[1]
    end

    erb :queues
  end

  # get '/workers' do
  #   erb :workers
  # end
  #
  # get '/failed' do
  #   erb :failed
  # end
  #
  # get '/scheduled' do
  #   erb :scheduled
  # end

  get '/overview-data' do
    JSON.generate({
      completed_jobs: Workerholic::StatsAPI.job_statistics( {category: 'completed_jobs', count_only: true} ),
      failed_jobs: Workerholic::StatsAPI.job_statistics( {category: 'failed_jobs', count_only: true} ),
      queued_jobs: Workerholic::StatsAPI.queued_jobs,
      workers_count: Workerholic.workers_count
    })
  end

  get '/detail-data' do
    JSON.generate({
      completed_jobs: Workerholic::StatsAPI.job_statistics( {category: 'completed_jobs', count_only: true} ),
      failed_jobs: Workerholic::StatsAPI.job_statistics( {category: 'failed_jobs', count_only: true} )
    })
  end

  get '/queue-data' do
    JSON.generate({
      queued_jobs: Workerholic::StatsAPI.queued_jobs
    })
  end
end
