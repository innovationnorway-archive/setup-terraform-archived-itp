variable "v" {
  description = "root module"
  default     = ""
}

module "child_a" {
  source = "./modules/child_a"
}
