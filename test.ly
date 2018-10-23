\version "2.18.2"
#(set! paper-alist (cons '("my size" . (cons (* 48 mm) (* 20 mm))) paper-alist))

\header { 
  tagline = ""  % removed 
} 

\paper {
  #(set-paper-size "my size")
}

\relative c'{
	c c d e f g
}