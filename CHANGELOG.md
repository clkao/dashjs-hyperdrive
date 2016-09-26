# Change Log
All notable changes to this project will be documented in this file.
This project adheres to [Semantic Versioning](http://semver.org/).
This changelog's template come from [keepachangelog.com](http://keepachangelog.com/). When editing this document, please follow the convention specified there.

## [Dev]
### Added
- `RequestModifier.modifyRequestHeader` support
- `withCredentials` param support
- Expose version on private and public API

### Changed
- Use getLiveDelay from dash.js MediaPlayer API if existent

## [Unreleased]

## [1.5.1] - 2016-08-18
### Fixed
- HTTPRequest import
- dist_wrapper.rb script

## [1.5.0] - 2016-08-18
### Updated
- dashjs version to 2.2.0

### Fixed
- scripts on Windows

## [1.4.2] - 2016-07-26
### Changed
- Pass media element to peer agent

## [1.4.0] - 2016-07-25
### Fixed
- Exception on `mediaPlayer.attachSource()` (playlist support).

## [1.3.0] - 2016-07-11
### Changed
- Publish npm dist as rc when comming from master
