{
  inputs = {
    flake-utils.url = "github:numtide/flake-utils";
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
  };

  outputs =
    inputs:
    inputs.flake-utils.lib.eachDefaultSystem (
      system:
      let
        pkgs = (import (inputs.nixpkgs) { inherit system; });
      in
      {
        devShell = pkgs.mkShell {
          shellHook = '' 
            PLAYWRIGHT_BROWSERS_PATH="$HOME/.cache/ms-playwright"
            export PLAYWRIGHT_BROWSERS_PATH
            export PLAYWRIGHT_SKIP_VALIDATE_HOST_REQUIREMENTS=true
            export PLAYWRIGHT_HOST_PLATFORM_OVERRIDE="ubuntu-24.04"

            export PLAYWRIGHT_MCP_BROWSER=chromium
            export PLAYWRIGHT_MCP_EXECUTABLE_PATH="$PLAYWRIGHT_BROWSERS_PATH/chromium-1217/chrome-linux64/chrome"
            export PLAYWRIGHT_MCP_USER_DATA_DIR="$HOME/.cache/playwright-mcp-profile"

            mkdir -p "$PLAYWRIGHT_BROWSERS_PATH" "$PLAYWRIGHT_MCP_USER_DATA_DIR"
            if [ -n "$(ls -A ${pkgs.playwright-driver.browsers})" ]; then
              cp -an ${pkgs.playwright-driver.browsers}/* "$PLAYWRIGHT_BROWSERS_PATH"/
            fi
          '';

          buildInputs = with pkgs; [
            git
            zip

            # web dev tools
            bun
            oxlint
            oxfmt
            playwright-driver.browsers

            # nix related
            nixpkgs-fmt

            # tasks
            (pkgs.writeShellScriptBin "format" ''
              if [ ! -d .git ]; then
                echo "This script must be run from the repository root"
                exit 1
              fi
              ${pkgs.oxfmt}/bin/oxfmt -c ./config/.oxfmtrc.json
            '')

            (pkgs.writeShellScriptBin "lint" ''
              if [ ! -d .git ]; then
                echo "This script must be run from the repository root"
                exit 1
              fi
              ${pkgs.oxlint}/bin/oxlint -c ./config/.oxlintrc.json
            '')

            (pkgs.writeShellScriptBin "build" ''
              if [ ! -d .git ]; then
                echo "This script must be run from the repository root"
                exit 1
              fi
              ${pkgs.bun}/bin/bun run build:common
              ${pkgs.bun}/bin/bun run build:web
              ${pkgs.bun}/bin/bun run build:backend
            '')

            (pkgs.writeShellScriptBin "run" ''
              if [ ! -d .git ]; then
                echo "This script must be run from the repository root"
                exit 1
              fi
              export NODE_ENV=production
              ${pkgs.bun}/bin/bun ./packages/backend/dist/main.js
            '')

            (pkgs.writeShellScriptBin "clean" ''
              if [ ! -d .git ]; then
                echo "This script must be run from the repository root"
                exit 1
              fi
              
              clean_path() {
                echo "Removing $1"
                rm -rf "$1"
              }
              
              echo "Cleaning up build artifacts and node_modules..."
              
              clean_path ./node_modules
              clean_path ./packages/backend/node_modules
              clean_path ./packages/backend/dist
              clean_path ./packages/common/node_modules
              clean_path ./packages/common/dist
              clean_path ./packages/web/node_modules
              clean_path ./packages/web/dist
              

              clean_path ./packages/web/tsconfig.app.tsbuildinfo
              clean_path ./packages/web/tsconfig.node.tsbuildinfo


              echo "Clean complete."
            '')

            (pkgs.writeShellScriptBin "build-oci-images" ''
              if [ ! -d .git ]; then
                echo "This script must be run from the repository root"
                exit 1
              fi
              tool=$(command -v podman || command -v docker)
              $tool build . -t the_application_name:local -f ./docker/Dockerfile
            '')
          ];
        };

      }
    );
}