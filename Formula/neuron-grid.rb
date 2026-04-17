class NeuronGrid < Formula
  desc "NeuronGrid: Private Local AI Cloud"
  homepage "https://github.com/Nilabh/neuron-grid"
  url "https://github.com/Nilabh/neuron-grid/releases/download/v1.0.0/NeuronGrid-macos.tar.gz"
  sha256 "REPLACE_WITH_ACTUAL_SHA256" # I will show you how to get this
  license "Commercial"

  depends_on "node"
  depends_on "python@3.10"

  def install
    bin.install "NeuronGrid"
  end

  test do
    system "#{bin}/NeuronGrid", "--version"
  end
end
