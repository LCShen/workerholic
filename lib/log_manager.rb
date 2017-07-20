require 'logger'

module Workerholic
  class LogManager
    attr_reader :logger, :severity

    def initialize(severity)
      @logger = Logger.new(STDOUT)
      @severity = severity
    end

    def log(message)
      logger.formatter = proc do |severity, datetime, progname, msg|
        "#{severity}: #{msg}\n"
      end

      logger.send(severity, message)
    end
  end
end
