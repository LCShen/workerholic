module Workerholic
  class StatsStorage
    def self.save_job(category, job)
      job_hash = job.to_hash
      job_hash[:klass] = job.klass.to_s
      job_hash[:wrapper] = nil
      serialized_job_stats = JobSerializer.serialize(job_hash)

      namespace = "workerholic:stats:#{category}:#{job.klass}"
      storage.push(namespace, serialized_job_stats)
    end

    def self.update_historical_stats(category, klass)
      current_day_secs = Time.now.to_i - (Time.now.to_i % 86400)
      namespace = "workerholic:stats:historical:#{category}"
      namespace_with_class = "workerholic:stats:historical:#{category}:#{klass}"

      storage.hash_increment_field(namespace, current_day_secs, 1)
      storage.hash_increment_field(namespace_with_class, current_day_secs, 1)
    end

    def self.save_processes_memory_usage
      PIDS.each do |pid|
        size = `ps -p #{Process.pid} -o pid=,rss=`.scan(/\d+/).last
        storage.hash_set('workerholic:stats:memory:processes', pid, size)
      end
    end

    def self.delete_memory_stats
      storage.delete('workerholic:stats:memory:processes')
    end

    class << self
      private

      def storage
        @storage ||= Storage::RedisWrapper.new
      end
    end
  end
end
