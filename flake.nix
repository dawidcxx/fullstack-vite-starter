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
        node = pkgs.nodejs_26;
      in
      {
        devShell = pkgs.mkShell {
          buildInputs = with pkgs; [
            git
            zip

            oxlint
            oxfmt
            node
            pnpm

            nixpkgs-fmt

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
              ${pkgs.pnpm}/bin/pnpm run build:common
              ${pkgs.pnpm}/bin/pnpm run build:web
              ${pkgs.pnpm}/bin/pnpm run build:backend
            '')

            (pkgs.writeShellScriptBin "run" ''
              if [ ! -d .git ]; then
                echo "This script must be run from the repository root"
                exit 1
              fi
              export NODE_ENV=production
              ${node}/bin/node ./packages/backend/dist/main.js
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
