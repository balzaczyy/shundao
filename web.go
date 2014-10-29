package main

import (
	"log"
	"net/http"
	"os"
	"path"
	"strings"
)

func main() {
	port := os.Getenv("VCAP_APP_PORT")
	if port == "" {
		port = "8080"
	}
	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		file := r.URL.Path
		if path.Ext(file) == "" {
			file = path.Join(file, "index.html")
		}
		if strings.HasPrefix(file, "/") {
			file = file[1:]
		}
		log.Printf("Serving %v", file)
		http.ServeFile(w, r, file)
	})
	log.Fatal(http.ListenAndServe(":"+port, nil))
}
