#!/usr/bin/env ruby

require 'fileutils'
require 'json'

package = JSON.parse (File.read (File.join ".", "package.json"))

VERSION = package['version'].inspect

NODE_BIN = File.join ".", "node_modules", ".bin"
BROWSERIFY = File.join NODE_BIN, "browserify"
UGLIFYJS = File.join NODE_BIN, "uglifyjs"

DIST_BUNDLE = File.join "dist", "bundle", "dashjs-p2p-bundle.js"
DASHJS_BUNDLE = File.join "lib", "DashjsBundle.js"

FileUtils.mkdir_p File.join("dist", "bundle")

def command(cmd)
  cmd.gsub! "/", "\\" if Gem.win_platform?
  puts "\e[36m#{cmd}\e[0m"
  puts %x(#{cmd})
end

command "#{BROWSERIFY} -p browserify-derequire -t [babelify] -s DashjsP2PBundle #{DASHJS_BUNDLE} | #{UGLIFYJS} -m --compress warnings=false --define '_VERSION_=#{VERSION}' > #{DIST_BUNDLE}"


