require_relative 'spec_helper'

describe Workerholic::JobScheduler do
  let(:redis) { Redis.new(url: Workerholic::REDIS_URL) }
  let(:scheduler) do
    Workerholic::JobScheduler.new(
      sorted_set: Workerholic::SortedSet.new(TEST_SCHEDULED_SORTED_SET)
    )
  end
  let(:serialized_job) do
    job = Workerholic::JobWrapper.new(
      class: ComplexJobTest,
      arguments: ['test job', { a: 1, b: 2 }, [1, 2, 3]],
      queue: Workerholic::Queue.new.name
    )

    Workerholic::JobSerializer.serialize(job)
  end

  it 'checks the time for scheduled job inside sorted set' do
    score = Time.now.to_f
    scheduler.schedule(serialized_job, score)

    expect(scheduler.job_due?).to eq(true)
  end

  it 'fetches a job from a sorted set' do
    score = Time.now.to_f
    scheduler.schedule(serialized_job, score)
    scheduler.enqueue_due_jobs

    expect(scheduler.sorted_set.empty?).to eq(true)
  end

  it 'enqueues due job to the main queue by default' do
    score = Time.now.to_f
    scheduler.schedule(serialized_job, score)
    scheduler.enqueue_due_jobs

    expect(Workerholic::Queue.new.empty?).to eq(false)
    expect(Workerholic::Queue.new.dequeue).to eq(serialized_job)
  end

  it 'enqueues due job in specific queue' do
    job = Workerholic::JobWrapper.new(
      class: ComplexJobTest,
      arguments: ['test job', { a: 1, b: 2 }, [1, 2, 3]],
      queue: TEST_QUEUE
    )
    serialized_job = Workerholic::JobSerializer.serialize(job)
    score = Time.now.to_f

    scheduler.schedule(serialized_job, score)
    scheduler.enqueue_due_jobs

    expect(Workerholic::Queue.new(TEST_QUEUE).empty?).to eq(false)
    expect(Workerholic::Queue.new(TEST_QUEUE).dequeue).to eq(serialized_job)
  end
end
